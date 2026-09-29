<?php

namespace App\Models\Ai;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class KnowledgeDocument extends Model
{
    use BelongsToStore;
    use SoftDeletes;

    public const UPLOADING = 'uploading';
    public const PROCESSING = 'processing';
    public const READY = 'ready';
    public const FAILED = 'failed';
    public const INACTIVE = 'inactive';

    public const TYPES = ['brand_guide', 'product_info', 'faq', 'returns_policy', 'shipping_policy', 'sales_script', 'marketing_playbook', 'campaign_notes', 'brand_voice', 'supplier_notes', 'internal_procedure', 'other'];

    protected $guarded = ['id'];

    protected $casts = [
        'metadata' => 'array',
        'last_used_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(fn (KnowledgeDocument $d) => $d->uuid ??= (string) Str::uuid());
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function versions(): HasMany
    {
        return $this->hasMany(KnowledgeDocumentVersion::class, 'document_id')->orderByDesc('version');
    }

    public function chunks(): HasMany
    {
        return $this->hasMany(KnowledgeChunk::class, 'document_id');
    }

    public function ingestionRuns(): HasMany
    {
        return $this->hasMany(KnowledgeIngestionRun::class, 'document_id')->orderByDesc('id');
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(KnowledgeCollection::class, 'collection_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isRetrievable(): bool
    {
        return $this->status === self::READY && $this->visibility === 'copilot' && ! $this->trashed();
    }
}
