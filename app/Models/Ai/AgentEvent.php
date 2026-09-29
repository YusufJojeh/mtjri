<?php

namespace App\Models\Ai;

use Illuminate\Database\Eloquent\Model;

class AgentEvent extends Model
{
    public $timestamps = false;

    protected $guarded = ['id'];

    protected $casts = [
        'payload' => 'array',
        'created_at' => 'datetime',
    ];
}
