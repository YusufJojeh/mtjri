<?php

namespace App\Ai\Knowledge;

use App\Ai\AiManager;
use App\Jobs\IngestKnowledgeDocument;
use App\Models\Ai\AiUsageRecord;
use App\Models\Ai\KnowledgeChunk;
use App\Models\Ai\KnowledgeDocument;
use App\Models\Ai\KnowledgeDocumentVersion;
use App\Models\Ai\KnowledgeIngestionRun;
use App\Models\Store;
use App\Models\User;
use App\Services\Notifications\MerchantNotifier;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Tijraa Knowledge lifecycle:
 * upload → validation → extraction → chunking → embeddings → index → READY.
 * States: uploading, processing, ready, failed, inactive (+ soft-deleted).
 */
class KnowledgeService
{
    public function __construct(private readonly AiManager $ai) {}

    public function upload(Store $store, User $user, UploadedFile $file, string $title, string $type, ?int $collectionId = null): KnowledgeDocument
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $path = $file->getRealPath();
        $checksum = hash_file('sha256', $path);

        $doc = KnowledgeDocument::create([
            'store_id' => $store->id,
            'collection_id' => $collectionId,
            'title' => $title,
            'doc_type' => in_array($type, KnowledgeDocument::TYPES, true) ? $type : 'other',
            'source_filename' => mb_substr($file->getClientOriginalName(), 0, 200),
            'mime' => $file->getClientMimeType(),
            'size_bytes' => $file->getSize(),
            'checksum' => $checksum,
            'status' => KnowledgeDocument::UPLOADING,
            'metadata' => ['extension' => $ext],
            'created_by' => $user->id,
        ]);

        $this->addVersion($doc, $user, $file);

        return $doc->fresh();
    }

    /** Upload a new version of an existing document (keeps history). */
    public function addVersion(KnowledgeDocument $doc, User $user, UploadedFile $file): KnowledgeDocumentVersion
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $version = ($doc->versions()->max('version') ?? 0) + 1;
        $stored = Storage::disk('local')->putFileAs("knowledge/{$doc->store_id}/{$doc->uuid}", $file, "v{$version}.{$ext}");

        $v = KnowledgeDocumentVersion::create([
            'document_id' => $doc->id,
            'version' => $version,
            'checksum' => hash_file('sha256', $file->getRealPath()),
            'storage_path' => $stored,
            'created_by' => $user->id,
        ]);
        $doc->update(['status' => KnowledgeDocument::PROCESSING, 'error' => null, 'metadata' => array_merge($doc->metadata ?? [], ['extension' => $ext]), 'size_bytes' => $file->getSize(), 'source_filename' => mb_substr($file->getClientOriginalName(), 0, 200)]);

        $this->queue($doc->id, $v->id);

        return $v;
    }

    /**
     * With a real queue worker the job is queued. Without one (sync driver)
     * it runs after the HTTP response is sent, so the merchant sees the
     * genuine Processing state instead of a blocked upload request.
     */
    private function queue(int $docId, int $versionId): void
    {
        if (config('queue.default') === 'sync' && ! app()->runningInConsole()) {
            IngestKnowledgeDocument::dispatchAfterResponse($docId, $versionId);
        } else {
            IngestKnowledgeDocument::dispatch($docId, $versionId);
        }
    }

    public function ingest(KnowledgeDocument $doc, KnowledgeDocumentVersion $version): void
    {
        $run = KnowledgeIngestionRun::create(['document_id' => $doc->id, 'version_id' => $version->id, 'status' => 'running', 'stage' => 'validation', 'started_at' => now()]);
        $started = microtime(true);
        $stage = 'validation';
        try {
            $doc->update(['status' => KnowledgeDocument::PROCESSING]);
            $ext = $doc->metadata['extension'] ?? pathinfo((string) $version->storage_path, PATHINFO_EXTENSION);
            if (! in_array($ext, config('tijraa.knowledge.allowed_extensions'), true)) {
                throw new KnowledgeException('unsupported_type', "Unsupported file type: {$ext}");
            }
            $full = Storage::disk('local')->path($version->storage_path);
            if (! is_file($full)) {
                throw new KnowledgeException('missing_file', 'The uploaded file is missing.');
            }

            $stage = 'extraction';
            $run->update(['stage' => $stage]);
            $text = (new TextExtractor())->extract($full, $ext);
            $version->update(['extracted_text' => $text, 'char_count' => mb_strlen($text)]);

            $stage = 'chunking';
            $run->update(['stage' => $stage]);
            $chunks = (new Chunker((int) config('tijraa.knowledge.chunk_chars'), (int) config('tijraa.knowledge.chunk_overlap')))->chunk($text);
            if (! $chunks) {
                throw new KnowledgeException('empty_text', 'No readable text was found in this document.');
            }

            $stage = 'embedding';
            $run->update(['stage' => $stage]);
            $embedder = $this->ai->embedder();
            $embedStart = microtime(true);
            try {
                $vectors = $embedder->embed(array_map(fn ($c) => ($c['heading'] ? $c['heading'] . "\n" : '') . $c['content'], $chunks));
            } catch (\Throwable $e) {
                // Provider embeddings failed: fall back to local embeddings, keep going.
                $embedder = new HashingEmbedder((int) config('tijraa.knowledge.embedding_dims', 512));
                $vectors = $embedder->embed(array_map(fn ($c) => $c['content'], $chunks));
            }
            AiUsageRecord::create([
                'store_id' => $doc->store_id, 'user_id' => $doc->created_by, 'feature' => 'knowledge',
                'provider' => str_starts_with($embedder->model(), 'openai:') ? 'openai' : 'local', 'model' => $embedder->model(),
                'input_tokens' => (int) (mb_strlen($text) / 4), 'latency_ms' => (int) ((microtime(true) - $embedStart) * 1000),
                'status' => 'ok',
            ]);

            $stage = 'indexing';
            $run->update(['stage' => $stage]);
            DB::transaction(function () use ($doc, $version, $chunks, $vectors, $embedder) {
                // Only the current version is ever retrievable.
                KnowledgeChunk::where('document_id', $doc->id)->delete();
                foreach ($chunks as $i => $c) {
                    KnowledgeChunk::create([
                        'store_id' => $doc->store_id,
                        'document_id' => $doc->id,
                        'version_id' => $version->id,
                        'chunk_index' => $i,
                        'heading' => $c['heading'] ? mb_substr($c['heading'], 0, 250) : null,
                        'content' => $c['content'],
                        'token_count' => (int) ceil(mb_strlen($c['content']) / 4),
                        'embedding' => isset($vectors[$i]) ? Vectors::pack($vectors[$i]) : null,
                        'embedding_model' => $embedder->model(),
                        'active' => true,
                    ]);
                }
                $doc->update(['status' => KnowledgeDocument::READY, 'current_version' => $version->version, 'chunk_count' => count($chunks), 'checksum' => $version->checksum, 'error' => null]);
            });

            $run->update(['status' => 'completed', 'stage' => 'done', 'finished_at' => now(), 'metrics' => [
                'chars' => mb_strlen($text), 'chunks' => count($chunks), 'embedding_model' => $embedder->model(),
                'duration_ms' => (int) ((microtime(true) - $started) * 1000),
            ]]);
            MerchantNotifier::notify($doc->store, 'knowledge_ready', ':title is ready for Tijraa Copilot', null, ['title' => $doc->title], route('knowledge.show', $doc->uuid), "knowledge_ready:{$doc->id}:{$version->version}");
        } catch (\Throwable $e) {
            $code = $e instanceof KnowledgeException ? $e->errorCode : 'processing_error';
            $message = $e instanceof KnowledgeException ? $e->getMessage() : 'The document could not be processed.';
            if (! $e instanceof KnowledgeException) {
                report($e);
            }
            $doc->update(['status' => KnowledgeDocument::FAILED, 'error' => $message]);
            $run->update(['status' => 'failed', 'stage' => $stage, 'error' => $code . ': ' . $message, 'finished_at' => now()]);
            MerchantNotifier::notify($doc->store, 'knowledge_failed', ':title could not be processed', $message, ['title' => $doc->title], route('knowledge.show', $doc->uuid), "knowledge_failed:{$doc->id}:{$version->version}");
        }
    }

    public function deactivate(KnowledgeDocument $doc): void
    {
        DB::transaction(function () use ($doc) {
            $doc->update(['status' => KnowledgeDocument::INACTIVE]);
            KnowledgeChunk::where('document_id', $doc->id)->update(['active' => false]);
        });
    }

    public function activate(KnowledgeDocument $doc): void
    {
        if ($doc->current_version < 1 || ! KnowledgeChunk::where('document_id', $doc->id)->exists()) {
            $this->retry($doc);

            return;
        }
        DB::transaction(function () use ($doc) {
            KnowledgeChunk::where('document_id', $doc->id)->update(['active' => true]);
            $doc->update(['status' => KnowledgeDocument::READY]);
        });
    }

    public function retry(KnowledgeDocument $doc): void
    {
        $v = $doc->versions()->first();
        abort_unless($v, 422, 'Nothing to process.');
        $doc->update(['status' => KnowledgeDocument::PROCESSING, 'error' => null]);
        $this->queue($doc->id, $v->id);
    }

    public function delete(KnowledgeDocument $doc): void
    {
        DB::transaction(function () use ($doc) {
            KnowledgeChunk::where('document_id', $doc->id)->delete();
            $doc->update(['status' => KnowledgeDocument::INACTIVE]);
            $doc->delete();
        });
        Storage::disk('local')->deleteDirectory("knowledge/{$doc->store_id}/{$doc->uuid}");
    }
}
