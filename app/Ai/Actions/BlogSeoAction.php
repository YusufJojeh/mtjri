<?php

namespace App\Ai\Actions;

use App\Models\Blog;
use Illuminate\Database\Eloquent\Model;

class BlogSeoAction extends SeoAction
{
    public function type(): string { return 'blog_seo'; }

    public function permission(): string { return 'edit-blog'; }

    protected function model(): string { return Blog::class; }

    protected function idKey(): string { return 'blog_id'; }

    protected function withKeywords(): bool { return false; }

    protected function url(Model $m): string { return route('blog.edit', $m->id); }
}
