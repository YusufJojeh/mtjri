<?php

namespace App\Ai\Actions;

use App\Models\CustomPage;
use Illuminate\Database\Eloquent\Model;

class PageSeoAction extends SeoAction
{
    public function type(): string { return 'page_seo'; }

    public function permission(): string { return 'edit-custom-pages'; }

    protected function model(): string { return CustomPage::class; }

    protected function idKey(): string { return 'page_id'; }

    protected function withKeywords(): bool { return true; }

    protected function url(Model $m): string { return route('custom-pages.edit', $m->id); }
}
