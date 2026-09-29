<?php

namespace App\Models\Ai;

use Illuminate\Database\Eloquent\Model;

class AiUsageRecord extends Model
{
    use BelongsToStore;

    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'fallback' => 'boolean',
        'cost_usd' => 'float',
        'created_at' => 'datetime',
    ];
}
