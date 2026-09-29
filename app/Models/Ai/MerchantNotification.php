<?php

namespace App\Models\Ai;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class MerchantNotification extends Model
{
    use BelongsToStore;

    protected $guarded = ['id'];

    protected $casts = [
        'params' => 'array',
        'read_at' => 'datetime',
    ];

    public function scopeUnread(Builder $q): Builder
    {
        return $q->whereNull('read_at');
    }
}
