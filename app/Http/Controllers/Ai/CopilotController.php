<?php

namespace App\Http\Controllers\Ai;

use App\Ai\AiBudget;
use App\Ai\AiManager;
use App\Ai\Presenters\AiPresenter;
use App\Ai\Runtime\AgentEvents;
use App\Ai\Runtime\AgentRunner;
use App\Ai\Tools\AgentProfiles;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Ai\Concerns\ScopesToStore;
use App\Models\Ai\AgentAction;
use App\Models\Ai\AgentEvent;
use App\Models\Ai\AgentRun;
use App\Models\Ai\AiUsageRecord;
use App\Models\Ai\CommerceInsight;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CopilotController extends Controller
{
    use ScopesToStore;

    public function __construct(private readonly AgentRunner $runner) {}

    public function index(Request $request)
    {
        return $this->page($request, null);
    }

    public function show(Request $request, AgentRun $run)
    {
        $this->authorizeRun($request, $run);

        return $this->page($request, $run);
    }

    private function page(Request $request, ?AgentRun $run)
    {
        $store = $this->currentStore($request);
        $user = $request->user();

        return Inertia::render('ai/copilot', [
            'runs' => AgentRun::forStore($store->id)->where('user_id', $user->id)->latest('updated_at')->limit(30)->get()->map(fn ($r) => AiPresenter::runSummary($r)),
            'run' => $run ? AiPresenter::run($run, $user) : null,
            'ai' => app(AiManager::class)->describe(),
            'budget' => app(AiBudget::class)->summary($store),
            'profiles' => AgentProfiles::ALL,
            'context' => $this->contextFromQuery($request),
            'prefill' => mb_substr((string) $request->query('q', ''), 0, 500),
            'insights' => CommerceInsight::forStore($store->id)->open()->orderByRaw("CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")->limit(4)->get(['id', 'type', 'severity', 'title', 'params']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'message' => 'required|string|max:4000',
            'profile' => 'nullable|string|in:' . implode(',', AgentProfiles::ALL),
            'context' => 'nullable|array',
            'context.resource_type' => 'nullable|string|in:product,order,customer,discount,blog,page',
            'context.resource_id' => 'nullable|integer',
        ]);
        $store = $this->currentStore($request);
        $run = $this->runner->start($store, $request->user(), $data['profile'] ?? AgentProfiles::COMMERCE, $data['message'], array_filter($data['context'] ?? []));
        if ($request->boolean('sync')) {
            $run = $this->runner->runToPause($run);
        }

        return response()->json(['run' => AiPresenter::run($run->fresh(), $request->user())], 201);
    }

    public function message(Request $request, AgentRun $run): JsonResponse
    {
        $this->authorizeRun($request, $run);
        $data = $request->validate(['message' => 'required|string|max:4000']);
        try {
            $run = $this->runner->followUp($run, $data['message']);
        } catch (\RuntimeException $e) {
            return response()->json(['error' => $e->getMessage()], 409);
        }
        if ($request->boolean('sync')) {
            $run = $this->runner->runToPause($run);
        }

        return response()->json(['run' => AiPresenter::run($run->fresh(), $request->user())]);
    }

    public function state(Request $request, AgentRun $run): JsonResponse
    {
        $this->authorizeRun($request, $run);

        return response()->json(['run' => AiPresenter::run($run, $request->user())]);
    }

    public function cancel(Request $request, AgentRun $run): JsonResponse
    {
        $this->authorizeRun($request, $run);
        $this->runner->cancel($run);

        return response()->json(['run' => AiPresenter::run($run->fresh(), $request->user())]);
    }

    /**
     * Server-Sent Events. Replays persisted events after Last-Event-ID (or
     * ?after=), then drives the run (one lease holder at a time) and pushes
     * new events live. Closes after ~50s or on a terminal state; the browser
     * reconnects with Last-Event-ID so nothing is lost or duplicated.
     */
    public function stream(Request $request, AgentRun $run): StreamedResponse
    {
        $this->authorizeRun($request, $run);
        $last = max((int) $request->header('Last-Event-ID', 0), (int) $request->query('after', 0));
        $window = app()->runningUnitTests() ? 2 : 50;

        return response()->stream(function () use ($run, $last, $window) {
            @set_time_limit($window + 30);
            $send = function (AgentEvent $e) use (&$last) {
                if ($e->seq <= $last) {
                    return;
                }
                $last = $e->seq;
                echo "id: {$e->seq}\nevent: {$e->type}\ndata: " . json_encode(['seq' => $e->seq, 'type' => $e->type, 'payload' => $e->payload ?? (object) [], 'at' => $e->created_at?->toIso8601String()], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n\n";
                $this->flush();
            };
            $replay = function () use ($run, &$last, $send) {
                AgentEvent::where('agent_run_id', $run->id)->where('seq', '>', $last)->orderBy('seq')->limit(500)->get()->each($send);
            };

            echo "retry: 1500\n\n";
            $replay();
            AgentEvents::listen($run->id, $send);
            $deadline = microtime(true) + $window;
            $beat = microtime(true);
            try {
                while (microtime(true) < $deadline && ! connection_aborted()) {
                    $run->refresh();
                    if ($run->needsWork()) {
                        $run = $this->runner->advance($run);
                    }
                    $replay();
                    if ($run->isTerminal()) {
                        break;
                    }
                    if (microtime(true) - $beat >= 15) {
                        echo "event: heartbeat\ndata: {\"seq\":{$last}}\n\n";
                        $this->flush();
                        $beat = microtime(true);
                    }
                    usleep(500_000);
                }
            } finally {
                AgentEvents::forget($run->id);
            }
            echo "event: stream_end\ndata: {\"status\":\"{$run->status}\",\"seq\":{$last}}\n\n";
            $this->flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache, no-transform',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }

    /** Reconstructable audit trail of one run (for owners / usage reviewers). */
    public function trace(Request $request, AgentRun $run): JsonResponse
    {
        $this->ensureStore($request, $run);
        abort_unless($run->user_id === $request->user()->id || $request->user()->can('view-ai-usage'), 404);

        return response()->json([
            'run' => $run->only(['uuid', 'profile', 'status', 'provider', 'model', 'prompt_version', 'context', 'step_count', 'tool_call_count', 'input_tokens', 'output_tokens', 'error_code', 'trace_id', 'created_at', 'completed_at']),
            'messages' => $run->messages()->orderBy('position')->get(['position', 'role', 'content', 'tool_calls', 'tool_call_id', 'answer', 'created_at']),
            'tool_calls' => $run->toolCalls()->orderBy('id')->get(['call_id', 'tool', 'category', 'arguments', 'status', 'summary', 'error_code', 'duration_ms', 'step', 'created_at']),
            'actions' => AgentAction::where('agent_run_id', $run->id)->get()->map(fn ($a) => AiPresenter::action($a) + ['payload' => $a->payload, 'execution_result' => $a->execution_result, 'trace_id' => $a->trace_id]),
            'events' => $run->events()->orderBy('seq')->get(['seq', 'type', 'payload', 'created_at']),
            'usage' => AiUsageRecord::where('agent_run_id', $run->id)->get(),
        ]);
    }

    private function authorizeRun(Request $request, AgentRun $run): void
    {
        $this->ensureStore($request, $run);
        // Conversations are private to the merchant user who started them.
        abort_unless($run->user_id === $request->user()->id, 404);
    }

    private function contextFromQuery(Request $request): ?array
    {
        $type = $request->query('resource_type');
        $id = (int) $request->query('resource_id');

        return in_array($type, ['product', 'order', 'customer', 'discount', 'blog', 'page'], true) && $id > 0 ? ['resource_type' => $type, 'resource_id' => $id] : null;
    }

    private function flush(): void
    {
        if (ob_get_level() > 0) {
            @ob_flush();
        }
        flush();
    }
}
