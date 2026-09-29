<?php

namespace App\Models\Ai;

use Illuminate\Database\Eloquent\Model;

class StoreOnboardingStep extends Model
{
    use BelongsToStore;

    protected $guarded = ['id'];

    protected $casts = ['data' => 'array'];
}
