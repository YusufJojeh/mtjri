<?php

namespace App\Jobs;

use App\Ai\Knowledge\KnowledgeService;
use App\Models\Ai\KnowledgeDocument;
use App\Models\Ai\KnowledgeDocumentVersion;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class IngestKnowledgeDocument implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 300;

    public function __construct(public readonly int $documentId, public readonly int $versionId) {}

    public function handle(KnowledgeService $service): void
    {
        $doc = KnowledgeDocument::find($this->documentId);
        $version = KnowledgeDocumentVersion::find($this->versionId);
        if ($doc && $version && $version->document_id === $doc->id) {
            $service->ingest($doc, $version);
        }
    }
}
