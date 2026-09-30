<?php

namespace App\Http\Controllers\Ai;

use App\Ai\Actions\ActionDecisionException;
use App\Ai\Actions\ActionService;
use App\Ai\Actions\ActionValidationException;
use App\Ai\AiBudget;
use App\Ai\AiManager;
use App\Ai\Content\ContentDraftService;
use App\Ai\Presenters\AiPresenter;
use App\Ai\Providers\AiProviderException;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Ai\Concerns\ScopesToStore;
use App\Models\Blog;
use App\Models\CustomPage;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * AI Content Studio: Current → Generate → Draft → Edit → Review → Save.
 * Saving goes through the same guarded action pipeline as Copilot proposals
 * (permission re-check, payload hash, stale-content check, audit trail).
 */
class ContentStudioController extends Controller
{
    use ScopesToStore;

    public function index(Request $request)
    {
        $store = $this->currentStore($request);

        return Inertia::render('ai/studio', [
            'ai' => app(AiManager::class)->describe(),
            'budget' => app(AiBudget::class)->summary($store),
            'selected' => $request->only(['scope', 'id', 'field']),
            'resources' => [
                'product' => Product::where('store_id', $store->id)->latest('id')->limit(200)->get(['id', 'name', 'description'])->map(fn ($p) => ['id' => $p->id, 'label' => $p->name, 'thin' => mb_strlen(trim(strip_tags((string) $p->description))) < 80]),
                'blog' => Blog::where('store_id', $store->id)->latest('id')->limit(100)->get(['id', 'title', 'meta_title', 'meta_description'])->map(fn ($b) => ['id' => $b->id, 'label' => $b->title, 'thin' => blank($b->meta_title) || blank($b->meta_description)]),
                'page' => CustomPage::where('store_id', $store->id)->latest('id')->limit(100)->get(['id', 'title', 'meta_title', 'meta_description'])->map(fn ($p) => ['id' => $p->id, 'label' => $p->title, 'thin' => blank($p->meta_title) || blank($p->meta_description)]),
            ],
        ]);
    }

    public function draft(Request $request, ContentDraftService $drafts): JsonResponse
    {
        $data = $this->validated($request, ['instructions' => 'nullable|string|max:500']);
        $store = $this->currentStore($request);
        $this->authorizeScope($request, $data['scope']);
        try {
            $result = $drafts->draft($store, $request->user(), $data['scope'], (int) $data['id'], $data['field'], (string) ($data['instructions'] ?? ''), 'content_studio', (string) Str::uuid());
        } catch (AiProviderException $e) {
            return response()->json(['error' => $e->errorCode, 'message' => $this->providerMessage($e->errorCode)], $e->errorCode === 'budget_exhausted' ? 402 : 503);
        }

        return response()->json($result);
    }

    /** Draft from unsaved editor content (product/blog/page forms). Nothing is saved. */
    public function compose(Request $request, ContentDraftService $drafts): JsonResponse
    {
        $data = $request->validate([
            'scope' => 'required|in:product,blog,page',
            'label' => 'required|string|max:160',
            'facts' => 'nullable|string|max:1500',
            'current' => 'nullable|string|max:3000',
            'field' => 'required|in:description,details,specifications,seo',
            'instructions' => 'nullable|string|max:600',
        ]);
        $this->authorizeScope($request, $data['scope'], true);
        try {
            $result = $drafts->compose($this->currentStore($request), $request->user(), $data['scope'], $data['label'], (string) ($data['facts'] ?? ''), (string) ($data['current'] ?? ''), $data['field'], (string) ($data['instructions'] ?? ''), 'content_editor', (string) Str::uuid());
        } catch (AiProviderException $e) {
            return response()->json(['error' => $e->errorCode, 'message' => $this->providerMessage($e->errorCode)], $e->errorCode === 'budget_exhausted' ? 402 : 503);
        }

        return response()->json($result);
    }

    public function apply(Request $request, ActionService $actions): JsonResponse
    {
        $data = $this->validated($request, [
            'text' => 'nullable|string|max:5000',
            'meta_title' => 'nullable|string|max:70',
            'meta_description' => 'nullable|string|max:170',
            'knowledge_used' => 'nullable|array|max:8',
        ]);
        $store = $this->currentStore($request);
        $this->authorizeScope($request, $data['scope']);
        [$type, $payload] = match (true) {
            $data['scope'] === 'product' && in_array($data['field'], ['description', 'details'], true) => ['product_copy', ['product_id' => (int) $data['id'], 'field' => $data['field'], 'text' => (string) ($data['text'] ?? '')]],
            $data['scope'] === 'blog' && $data['field'] === 'seo' => ['blog_seo', ['blog_id' => (int) $data['id'], 'meta_title' => $data['meta_title'] ?? null, 'meta_description' => $data['meta_description'] ?? null]],
            $data['scope'] === 'page' && $data['field'] === 'seo' => ['page_seo', ['page_id' => (int) $data['id'], 'meta_title' => $data['meta_title'] ?? null, 'meta_description' => $data['meta_description'] ?? null]],
            default => abort(422, 'This field cannot be saved from Content Studio.'),
        };
        try {
            $action = $actions->propose($store, $request->user(), $type, array_filter($payload, fn ($v) => $v !== null), [
                'source' => 'content_studio',
                'goal' => 'Content Studio edit',
                'knowledge_used' => $this->cleanKnowledge($data['knowledge_used'] ?? []),
                'trace_id' => (string) Str::uuid(),
            ]);
            $action = $actions->approve($action, $request->user(), $action->payload_hash, null, $request->boolean('acknowledge_stale'));
        } catch (ActionValidationException $e) {
            return response()->json(['error' => 'invalid', 'message' => implode(' ', $e->errors)], 422);
        } catch (ActionDecisionException $e) {
            return response()->json(['error' => $e->errorCode, 'message' => $e->getMessage()], $e->status());
        }

        return response()->json(['action' => AiPresenter::action($action, $request->user())], $action->status === 'executed' ? 200 : 422);
    }

    private function validated(Request $request, array $extra): array
    {
        return $request->validate([
            'scope' => 'required|in:product,blog,page',
            'id' => 'required|integer|min:1',
            'field' => 'required|in:description,details,seo',
        ] + $extra);
    }

    private function authorizeScope(Request $request, string $scope, bool $orCreate = false): void
    {
        $perm = ['product' => 'edit-products', 'blog' => 'edit-blog', 'page' => 'edit-custom-pages'][$scope];
        $create = ['product' => 'create-products', 'blog' => 'create-blog', 'page' => 'create-custom-pages'][$scope];
        abort_unless($request->user()->can($perm) || ($orCreate && $request->user()->can($create)), 403);
    }

    private function cleanKnowledge(array $items): array
    {
        return collect($items)->take(8)->map(fn ($k) => [
            'document' => mb_substr((string) ($k['document'] ?? ''), 0, 160),
            'version' => (int) ($k['version'] ?? 0),
            'section' => isset($k['section']) ? mb_substr((string) $k['section'], 0, 160) : null,
        ])->filter(fn ($k) => $k['document'] !== '')->values()->all();
    }

    private function providerMessage(string $code): string
    {
        return match ($code) {
            'budget_exhausted' => __('Your AI allowance for this month is used up. It resets at the start of next month.'),
            'not_configured' => __('No AI provider is connected yet. Add an API key in Settings.'),
            'rate_limited' => __('The AI provider is busy. Try again in a minute.'),
            'timeout' => __('The AI provider took too long to respond. Try again.'),
            default => __('The AI provider could not complete this request. Try again.'),
        };
    }
}
