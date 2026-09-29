<?php

namespace App\Models\Ai;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KnowledgeCollection extends Model
{
    use BelongsToStore;

    protected $guarded = ['id'];

    public function documents(): HasMany
    {
        return $this->hasMany(KnowledgeDocument::class, 'collection_id');
    }
}
