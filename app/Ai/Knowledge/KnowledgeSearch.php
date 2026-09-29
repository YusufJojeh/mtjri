<?php

namespace App\Ai\Knowledge;

use App\Models\Ai\KnowledgeChunk;
use App\Models\Ai\KnowledgeDocument;
use Illuminate\Support\Collection;

/**
 * Hybrid retrieval over one store's knowledge.
 *
 * Isolation first: candidates are selected with `store_id = ?`, active
 * chunks, READY + copilot-visible + not-deleted documents — all in SQL —
 * and only then scored (BM25 + embedding cosine). Nothing from another store
 * or an inactive/deleted document can reach scoring.
 */
class KnowledgeSearch
{
    private const K1 = 1.4;
    private const B = 0.72;

    public function __construct(private readonly Embedder $embedder) {}

    /**
     * @return Collection<int, array{chunk_id:int,document_id:int,document_uuid:string,document:string,doc_type:string,version:int,heading:?string,excerpt:string,score:float}>
     */
    public function search(int $storeId, string $query, int $limit = 5, array $filters = []): Collection
    {
        $query = trim($query);
        if ($query === '') {
            return collect();
        }

        $candidates = KnowledgeChunk::query()
            ->select('knowledge_chunks.*')
            ->join('knowledge_documents as d', 'd.id', '=', 'knowledge_chunks.document_id')
            ->join('knowledge_document_versions as v', 'v.id', '=', 'knowledge_chunks.version_id')
            ->where('knowledge_chunks.store_id', $storeId)
            ->where('d.store_id', $storeId)
            ->where('knowledge_chunks.active', true)
            ->where('d.status', KnowledgeDocument::READY)
            ->where('d.visibility', 'copilot')
            ->whereNull('d.deleted_at')
            ->whereColumn('v.version', 'd.current_version')
            ->when(! empty($filters['doc_type']), fn ($q) => $q->where('d.doc_type', $filters['doc_type']))
            ->addSelect(['d.title as doc_title', 'd.doc_type as doc_type', 'd.uuid as doc_uuid', 'v.version as doc_version'])
            ->limit(5000)
            ->get();

        if ($candidates->isEmpty()) {
            return collect();
        }

        $qTokens = array_unique(Tokenizer::tokens($query));
        $docsTokens = $candidates->mapWithKeys(fn ($c) => [$c->id => Tokenizer::tokens(($c->heading ? $c->heading . ' ' : '') . $c->content)]);
        $n = $candidates->count();
        $avgdl = max(1, $docsTokens->avg(fn ($t) => count($t)));
        $df = [];
        foreach ($qTokens as $t) {
            $df[$t] = $docsTokens->filter(fn ($toks) => in_array($t, $toks, true))->count();
        }

        $qVec = null;
        $model = $this->embedder->model();
        if ($candidates->contains(fn ($c) => $c->embedding_model === $model)) {
            $qVec = $this->embedder->embed([$query])[0] ?? null;
        }

        $scored = $candidates->map(function ($c) use ($qTokens, $docsTokens, $n, $avgdl, $df, $qVec, $model) {
            $toks = $docsTokens[$c->id];
            $tf = array_count_values($toks);
            $len = count($toks);
            $bm25 = 0.0;
            foreach ($qTokens as $t) {
                if (! isset($tf[$t])) {
                    continue;
                }
                $idf = log(1 + ($n - $df[$t] + 0.5) / ($df[$t] + 0.5));
                $bm25 += $idf * ($tf[$t] * (self::K1 + 1)) / ($tf[$t] + self::K1 * (1 - self::B + self::B * $len / $avgdl));
            }
            $cos = 0.0;
            if ($qVec && $c->embedding_model === $model) {
                $vec = Vectors::unpack($c->embedding);
                $cos = $vec ? max(0.0, Vectors::cosine($qVec, $vec)) : 0.0;
            }

            return ['chunk' => $c, 'bm25' => $bm25, 'cos' => $cos];
        });

        $maxBm = max(1e-9, $scored->max('bm25'));
        $hasVec = $qVec !== null;
        $minScore = (float) config('tijraa.knowledge.min_score', 0.08);

        return $scored->map(function ($s) use ($maxBm, $hasVec) {
            $norm = $s['bm25'] / $maxBm;
            // Absolute BM25 guards against normalising noise into a "match".
            $lexical = $s['bm25'] > 0 ? $norm * min(1.0, $s['bm25'] / 2.0 + 0.35) : 0.0;
            $s['score'] = $hasVec ? 0.6 * $lexical + 0.4 * $s['cos'] : $lexical;

            return $s;
        })
            ->filter(fn ($s) => $s['score'] >= $minScore)
            ->sortByDesc('score')
            ->unique(fn ($s) => $s['chunk']->document_id . ':' . $s['chunk']->chunk_index)
            ->take($limit)
            ->values()
            ->map(fn ($s) => [
                'chunk_id' => $s['chunk']->id,
                'document_id' => $s['chunk']->document_id,
                'document_uuid' => $s['chunk']->doc_uuid,
                'document' => $s['chunk']->doc_title,
                'doc_type' => $s['chunk']->doc_type,
                'version' => (int) $s['chunk']->doc_version,
                'heading' => $s['chunk']->heading,
                'excerpt' => mb_substr($s['chunk']->content, 0, 700),
                'score' => round($s['score'], 4),
            ]);
    }

    /** Record that documents were used (for "last used" and usage counts). */
    public static function recordUsage(int $storeId, Collection $results): void
    {
        $ids = $results->pluck('document_id')->unique()->values();
        if ($ids->isNotEmpty()) {
            KnowledgeDocument::forStore($storeId)->whereIn('id', $ids)->update(['last_used_at' => now()]);
            KnowledgeDocument::forStore($storeId)->whereIn('id', $ids)->increment('usage_count');
        }
    }
}
