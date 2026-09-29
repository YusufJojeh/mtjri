<?php

namespace App\Models\Ai;

use Illuminate\Database\Eloquent\Model;

class KnowledgeIngestionRun extends Model
{
    protected $guarded = ['id'];

    protected $casts = [
        'metrics' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];
}
