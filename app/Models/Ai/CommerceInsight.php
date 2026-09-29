<?php

namespace App\Models\Ai;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class CommerceInsight extends Model
{
    use BelongsToStore;

    protected $guarded = ['id'];

    protected $casts = [
        'evidence' => 'array',
        'params' => 'array',
        'previous_value' => 'float',
        'current_value' => 'float',
        'estimated_impact' => 'float',
        'detected_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'resolved_at' => 'datetime',
        'dismissed_at' => 'datetime',
    ];

    public function scopeOpen(Builder $q): Builder
    {
        return $q->whereNull('resolved_at')->whereNull('dismissed_at');
    }
}
