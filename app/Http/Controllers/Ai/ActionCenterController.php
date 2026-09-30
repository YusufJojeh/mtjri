<?php

namespace App\Http\Controllers\Ai;

use App\Ai\Actions\ActionDecisionException;
use App\Ai\Actions\ActionService;
use App\Ai\Presenters\AiPresenter;
use App\Ai\Runtime\AgentRunner;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Ai\Concerns\ScopesToStore;
use App\Models\Ai\AgentAction;
use App\Models\Ai\AgentRun;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActionCenterController extends Controller
{
    use ScopesToStore;

    private const TABS = ['pending', 'executed', 'rejected', 'failed', 'expired', 'all'];

    public function __construct(private readonly ActionService $actions) {}

    public function index(Request $request)
    {
        $store = $this->currentStore($request);
        $this->actions->expireStale();
        $tab = in_array($request->query('status'), self::TABS, true) ? $request->query('status') : 'pending';
        $query = AgentAction::forStore($store->id)->with(['run', 'creator', 'decider'])->latest('id');
        if ($tab === 'expired') {
            $query->whereIn('status', [AgentAction::EXPIRED, AgentAction::CANCELLED]);
        } elseif ($tab !== 'all') {
            $query->where('status', $tab);
        }
        $counts = AgentAction::forStore($store->id)->selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');
        $page = $query->paginate(20)->withQueryString();
        $selected = $request->query('action') ? AgentAction::forStore($store->id)->where('uuid', $request->query('action'))->first() : null;

        return Inertia::render('ai/actions', [
            'tab' => $tab,
            'counts' => $counts,
            'actions' => [
                'data' => collect($page->items())->map(fn ($a) => AiPresenter::action($a, $request->user())),
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'total' => $page->total(),
            ],
            'selected' => $selected ? AiPresenter::action($selected, $request->user()) : null,
        ]);
    }

    public function show(Request $request, AgentAction $action)
    {
        $this->ensureStore($request, $action);
        if ($request->wantsJson()) {
            return response()->json(['action' => AiPresenter::action($action, $request->user())]);
        }

        return redirect()->route('ai-actions.index', ['action' => $action->uuid, 'status' => $action->status === AgentAction::PENDING ? 'pending' : 'all']);
    }

    public function approve(Request $request, AgentAction $action): JsonResponse
    {
        $this->ensureStore($request, $action);
        $data = $request->validate([
            'payload_hash' => 'required|string|size:64',
            'edits' => 'nullable|array',
            'acknowledge_stale' => 'nullable|boolean',
        ]);
        try {
            $action = $this->actions->approve($action, $request->user(), $data['payload_hash'], $data['edits'] ?? null, (bool) ($data['acknowledge_stale'] ?? false));
        } catch (ActionDecisionException $e) {
            return response()->json(['error' => $e->errorCode, 'message' => $e->getMessage()], $e->status());
        }
        $this->resumeAfterResponse($action);

        return response()->json(['action' => AiPresenter::action($action, $request->user())]);
    }

    public function reject(Request $request, AgentAction $action): JsonResponse
    {
        $this->ensureStore($request, $action);
        $data = $request->validate(['note' => 'nullable|string|max:500']);
        try {
            $action = $this->actions->reject($action, $request->user(), $data['note'] ?? null);
        } catch (ActionDecisionException $e) {
            return response()->json(['error' => $e->errorCode, 'message' => $e->getMessage()], $e->status());
        }
        $this->resumeAfterResponse($action);

        return response()->json(['action' => AiPresenter::action($action, $request->user())]);
    }

    /**
     * The originating run continues after the decision even if no Copilot tab
     * is open. The run lease guarantees only one worker advances it.
     */
    private function resumeAfterResponse(AgentAction $action): void
    {
        if (! $action->agent_run_id) {
            return;
        }
        $runId = $action->agent_run_id;
        app()->terminating(function () use ($runId) {
            $run = AgentRun::find($runId);
            if ($run && $run->needsWork()) {
                app(AgentRunner::class)->runToPause($run);
            }
        });
    }
}
