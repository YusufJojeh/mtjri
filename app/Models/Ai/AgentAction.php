<?php

namespace App\Models\Ai;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class AgentAction extends Model
{
    use BelongsToStore;

    public const PENDING = 'pending';
    public const EXECUTING = 'executing';
    public const EXECUTED = 'executed';
    public const REJECTED = 'rejected';
    public const EXPIRED = 'expired';
    public const FAILED = 'failed';
    public const CANCELLED = 'cancelled';

    protected $guarded = ['id'];

    protected $casts = [
        'payload' => 'array',
        'preview' => 'array',
        'knowledge_used' => 'array',
        'execution_result' => 'array',
        'decided_at' => 'datetime',
        'expires_at' => 'datetime',
        'executed_at' => 'datetime',
        'edited' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::creating(function (AgentAction $a) {
            $a->uuid ??= (string) Str::uuid();
            $a->trace_id ??= Str::lower(Str::random(24));
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function run(): BelongsTo
    {
        return $this->belongsTo(AgentRun::class, 'agent_run_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function decider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }

    public function isExpired(): bool
    {
        return $this->status === self::PENDING && $this->expires_at !== null && $this->expires_at->isPast();
    }

    /** Canonical hash of a payload: what the merchant approves is exactly what executes. */
    public static function hashPayload(array $payload): string
    {
        return hash('sha256', json_encode(self::canonical($payload), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private static function canonical(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }
        if (array_is_list($value)) {
            return array_map([self::class, 'canonical'], $value);
        }
        ksort($value);

        return array_map([self::class, 'canonical'], $value);
    }
}
