<?php

namespace App\Models\Ai;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AgentRun extends Model
{
    use BelongsToStore;

    public const STATUS_QUEUED = 'queued';
    public const STATUS_RUNNING = 'running';
    public const STATUS_WAITING = 'waiting_for_approval';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    public const TERMINAL = [self::STATUS_COMPLETED, self::STATUS_FAILED, self::STATUS_CANCELLED];

    protected $guarded = ['id'];

    protected $casts = [
        'context' => 'array',
        'lease_expires_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (AgentRun $run) {
            $run->uuid ??= (string) Str::uuid();
            $run->trace_id ??= Str::lower(Str::random(24));
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AgentMessage::class)->orderBy('position');
    }

    public function toolCalls(): HasMany
    {
        return $this->hasMany(AgentToolCall::class)->orderBy('id');
    }

    public function actions(): HasMany
    {
        return $this->hasMany(AgentAction::class)->orderBy('id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(AgentEvent::class)->orderBy('seq');
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, self::TERMINAL, true);
    }

    public function needsWork(): bool
    {
        return in_array($this->status, [self::STATUS_QUEUED, self::STATUS_RUNNING], true);
    }
}
