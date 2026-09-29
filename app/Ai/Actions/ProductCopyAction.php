<?php

namespace App\Ai\Actions;

use App\Models\Product;
use App\Models\Store;
use App\Models\User;

class ProductCopyAction extends ActionType
{
    public const FIELDS = ['description' => 'Description', 'specifications' => 'Specifications', 'details' => 'Additional details'];

    public function type(): string { return 'product_copy'; }

    public function permission(): string { return 'edit-products'; }

    public function validate(Store $store, array $payload): array
    {
        $errors = [];
        $field = $payload['field'] ?? 'description';
        if (! array_key_exists($field, self::FIELDS)) {
            $errors[] = 'field must be description, specifications or details';
        }
        $text = trim((string) ($payload['text'] ?? ''));
        if (mb_strlen($text) < 20) {
            $errors[] = 'text must be at least 20 characters';
        }
        if (mb_strlen($text) > 5000) {
            $errors[] = 'text must be at most 5000 characters';
        }
        if (! Product::where('store_id', $store->id)->whereKey((int) ($payload['product_id'] ?? 0))->exists()) {
            $errors[] = 'product not found in this store';
        }
        if ($errors) {
            throw new ActionValidationException($errors);
        }

        return ['product_id' => (int) $payload['product_id'], 'field' => $field, 'text' => $text];
    }

    public function resource(Store $store, array $payload): array
    {
        $p = Product::where('store_id', $store->id)->find($payload['product_id']);

        return ['type' => 'product', 'id' => $p?->id, 'label' => $p?->name, 'url' => $p ? route('products.show', $p->id) : null];
    }

    public function preview(Store $store, array $payload): array
    {
        $p = Product::where('store_id', $store->id)->find($payload['product_id']);

        return [
            'kind' => 'text',
            'fields' => [[
                'key' => 'text',
                'label' => self::FIELDS[$payload['field']],
                'before' => Html::toText($p?->{$payload['field']}),
                'after' => $payload['text'],
                'format' => 'text',
                'editable' => true,
            ]],
        ];
    }

    public function editableFields(): array
    {
        return ['text'];
    }

    public function execute(Store $store, User $user, array $payload): array
    {
        $p = Product::where('store_id', $store->id)->lockForUpdate()->findOrFail($payload['product_id']);
        $p->{$payload['field']} = Html::fromText($payload['text']);
        $p->save();

        return ['product_id' => $p->id, 'field' => $payload['field'], 'updated_at' => $p->updated_at->toIso8601String(), 'url' => route('products.show', $p->id)];
    }
}
