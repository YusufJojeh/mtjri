<?php

namespace App\Http\Controllers\Ai;

use App\Ai\AiManager;
use App\Ai\Knowledge\KnowledgeSearch;
use App\Ai\Knowledge\KnowledgeService;
use App\Ai\Presenters\AiPresenter;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Ai\Concerns\ScopesToStore;
use App\Models\Ai\KnowledgeDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class KnowledgeController extends Controller
{
    use ScopesToStore;

    public function __construct(private readonly KnowledgeService $knowledge) {}

    public function index(Request $request)
    {
        $store = $this->currentStore($request);
        $docs = KnowledgeDocument::forStore($store->id)->latest('updated_at')->get();

        return Inertia::render('ai/knowledge/index', [
            'documents' => $docs->map(fn ($d) => AiPresenter::document($d))->values(),
            'types' => KnowledgeDocument::TYPES,
            'stats' => [
                'ready' => $docs->where('status', KnowledgeDocument::READY)->count(),
                'processing' => $docs->whereIn('status', [KnowledgeDocument::UPLOADING, KnowledgeDocument::PROCESSING])->count(),
                'failed' => $docs->where('status', KnowledgeDocument::FAILED)->count(),
                'inactive' => $docs->where('status', KnowledgeDocument::INACTIVE)->count(),
                'chunks' => (int) $docs->where('status', KnowledgeDocument::READY)->sum('chunk_count'),
            ],
            'limits' => ['max_kb' => (int) config('tijraa.knowledge.max_upload_kb'), 'extensions' => config('tijraa.knowledge.allowed_extensions')],
            'embedder' => app(AiManager::class)->embedder()->model(),
        ]);
    }

    public function show(Request $request, KnowledgeDocument $document)
    {
        $this->ensureStore($request, $document);
        $version = $document->versions()->where('version', $document->current_version)->first();

        return Inertia::render('ai/knowledge/show', [
            'document' => AiPresenter::document($document),
            'versions' => $document->versions()->orderByDesc('version')->get(['version', 'char_count', 'created_at'])->map(fn ($v) => ['version' => $v->version, 'chars' => $v->char_count, 'created_at' => $v->created_at?->toIso8601String()]),
            'ingestions' => $document->ingestionRuns()->latest('id')->limit(10)->get(['status', 'stage', 'error', 'metrics', 'started_at', 'finished_at'])->map(fn ($r) => [
                'status' => $r->status, 'stage' => $r->stage, 'error' => $r->error, 'metrics' => $r->metrics,
                'started_at' => $r->started_at?->toIso8601String(), 'finished_at' => $r->finished_at?->toIso8601String(),
            ]),
            'chunks' => $version ? $document->chunks()->where('version_id', $version->id)->orderBy('chunk_index')->limit(60)->get(['chunk_index', 'heading', 'content', 'token_count'])->map(fn ($c) => ['index' => $c->chunk_index, 'heading' => $c->heading, 'preview' => mb_substr($c->content, 0, 400), 'tokens' => $c->token_count]) : [],
        ]);
    }

    public function status(Request $request, KnowledgeDocument $document): JsonResponse
    {
        $this->ensureStore($request, $document);

        return response()->json(['document' => AiPresenter::document($document)]);
    }

    public function store(Request $request)
    {
        $store = $this->currentStore($request);
        $data = $request->validate([
            'file' => 'required|file|max:' . (int) config('tijraa.knowledge.max_upload_kb') . '|extensions:' . implode(',', config('tijraa.knowledge.allowed_extensions')),
            'title' => 'nullable|string|max:160',
            'type' => 'required|string|in:' . implode(',', KnowledgeDocument::TYPES),
        ]);
        $title = trim($data['title'] ?? '') ?: pathinfo($request->file('file')->getClientOriginalName(), PATHINFO_FILENAME);
        $doc = $this->knowledge->upload($store, $request->user(), $request->file('file'), $title, $data['type']);

        return $request->wantsJson()
            ? response()->json(['document' => AiPresenter::document($doc->fresh())], 201)
            : back()->with('success', __('Document uploaded. Processing has started.'));
    }

    public function version(Request $request, KnowledgeDocument $document)
    {
        $this->ensureStore($request, $document);
        $request->validate(['file' => 'required|file|max:' . (int) config('tijraa.knowledge.max_upload_kb') . '|extensions:' . implode(',', config('tijraa.knowledge.allowed_extensions'))]);
        $this->knowledge->addVersion($document, $request->user(), $request->file('file'));

        return $this->done($request, $document, __('New version uploaded. Processing has started.'));
    }

    public function deactivate(Request $request, KnowledgeDocument $document)
    {
        $this->ensureStore($request, $document);
        $this->knowledge->deactivate($document);

        return $this->done($request, $document, __('Document deactivated. Tijraa will no longer use it.'));
    }

    public function activate(Request $request, KnowledgeDocument $document)
    {
        $this->ensureStore($request, $document);
        $this->knowledge->activate($document);

        return $this->done($request, $document, __('Document activated.'));
    }

    public function retry(Request $request, KnowledgeDocument $document)
    {
        $this->ensureStore($request, $document);
        $this->knowledge->retry($document);

        return $this->done($request, $document, __('Processing restarted.'));
    }

    public function destroy(Request $request, KnowledgeDocument $document)
    {
        $this->ensureStore($request, $document);
        $this->knowledge->delete($document);

        return $request->wantsJson() ? response()->json(['deleted' => true]) : redirect()->route('knowledge.index')->with('success', __('Document deleted.'));
    }

    /** Retrieval test: shows exactly what Copilot would see for a query. */
    public function search(Request $request): JsonResponse
    {
        $store = $this->currentStore($request);
        $data = $request->validate(['query' => 'required|string|max:300']);
        $t0 = microtime(true);
        $hits = (new KnowledgeSearch(app(AiManager::class)->embedder()))->search($store->id, $data['query'], 5);

        return response()->json([
            'results' => $hits->values()->map(fn ($h) => [
                'document' => $h['document'], 'document_id' => $h['document_uuid'], 'version' => $h['version'], 'type' => $h['doc_type'],
                'section' => $h['heading'], 'excerpt' => mb_substr($h['excerpt'], 0, 500), 'score' => $h['score'],
            ]),
            'latency_ms' => (int) ((microtime(true) - $t0) * 1000),
        ]);
    }

    private function done(Request $request, KnowledgeDocument $document, string $message)
    {
        return $request->wantsJson() ? response()->json(['document' => AiPresenter::document($document->fresh())]) : back()->with('success', $message);
    }
}
