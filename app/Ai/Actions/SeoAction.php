<?php

namespace App\Ai\Actions;

use App\Models\Blog;
use App\Models\CustomPage;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/** SEO metadata for blog posts (blog_seo) and store pages (page_seo). */
abstract class SeoAction extends ActionType
{
    abstract protected function model(): string;

    abstract protected function idKey(): string;

    abstract protected function withKeywords(): bool;

    abstract protected function url(Model $m): string;

    protected function find(Store $store, array $payload): ?Model
    {
        $cls = $this->model();

        return $cls::where('store_id', $store->id)->find((int) ($payload[$this->idKey()] ?? 0));
    }

    public function validate(Store $store, array $payload): array
    {
        $e = [];
        if (! $this->find($store, $payload)) $e[] = 'record not found in this store';
        $title = trim((string) ($payload['meta_title'] ?? ''));
        $desc = trim((string) ($payload['meta_description'] ?? ''));
        if ($title === '' && $desc === '') $e[] = 'provide meta_title and/or meta_description';
        if (mb_strlen($title) > 70) $e[] = 'meta_title must be at most 70 characters';
        if (mb_strlen($desc) > 170) $e[] = 'meta_description must be at most 170 characters';
        $out = [$this->idKey() => (int) ($payload[$this->idKey()] ?? 0)];
        if ($title !== '') $out['meta_title'] = $title;
        if ($desc !== '') $out['meta_description'] = $desc;
        if ($this->withKeywords() && ! empty($payload['meta_keywords'])) {
            $kw = mb_substr(trim((string) $payload['meta_keywords']), 0, 255);
            $out['meta_keywords'] = $kw;
        }
        if ($e) {
            throw new ActionValidationException($e);
        }

        return $out;
    }

    public function resource(Store $store, array $payload): array
    {
        $m = $this->find($store, $payload);

        return ['type' => $this->type() === 'blog_seo' ? 'blog' : 'page', 'id' => $m?->id, 'label' => $m?->title, 'url' => $m ? $this->url($m) : null];
    }

    public function preview(Store $store, array $payload): array
    {
        $m = $this->find($store, $payload);
        $labels = ['meta_title' => 'Meta title', 'meta_description' => 'Meta description', 'meta_keywords' => 'Meta keywords'];
        $fields = [];
        foreach ($labels as $k => $label) {
            if (array_key_exists($k, $payload)) {
                $fields[] = ['key' => $k, 'label' => $label, 'before' => (string) ($m?->{$k} ?? ''), 'after' => $payload[$k], 'format' => 'text', 'editable' => true];
            }
        }

        return ['kind' => 'seo', 'fields' => $fields, 'limits' => ['meta_title' => 60, 'meta_description' => 160]];
    }

    public function editableFields(): array
    {
        return ['meta_title', 'meta_description', 'meta_keywords'];
    }

    public function execute(Store $store, User $user, array $payload): array
    {
        $m = $this->find($store, $payload);
        if (! $m) {
            throw new ActionValidationException(['record no longer exists']);
        }
        foreach (['meta_title', 'meta_description', 'meta_keywords'] as $k) {
            if (array_key_exists($k, $payload)) {
                $m->{$k} = $payload[$k];
            }
        }
        $m->save();

        return ['id' => $m->id, 'url' => $this->url($m)];
    }
}
