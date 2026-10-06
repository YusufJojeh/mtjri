<?php

namespace App\Rules;

use App\Support\MediaReference;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class LocalImageReference implements ValidationRule
{
    /**
     * @param bool $multiple When true, validates a comma-separated list of image references.
     */
    public function __construct(
        private readonly bool $multiple = false
    ) {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (!is_string($value)) {
            $fail(__('The :attribute must be a string.', ['attribute' => str_replace('_', ' ', $attribute)]));
            return;
        }

        $references = $this->multiple
            ? array_filter(array_map('trim', explode(',', $value)), static fn (string $item): bool => $item !== '')
            : [trim($value)];

        foreach ($references as $reference) {
            if (!$this->isAllowedReference($reference)) {
                $fail(__('The :attribute must use a local path or an allowed application image URL.', [
                    'attribute' => str_replace('_', ' ', $attribute),
                ]));
                return;
            }
        }
    }

    private function isAllowedReference(string $reference): bool
    {
        return MediaReference::isAllowedReference($reference, request());
    }
}
