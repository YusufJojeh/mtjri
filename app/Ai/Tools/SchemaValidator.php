<?php

namespace App\Ai\Tools;

/**
 * Minimal JSON-schema validation for tool arguments (object/string/integer/
 * number/boolean/array, required, enum, min/max, maxLength, items).
 * Unknown properties are dropped; defaults are applied.
 */
final class SchemaValidator
{
    public static function validate(array $schema, array $args): array
    {
        $errors = [];
        $out = self::check($schema, $args, 'arguments', $errors);
        if ($errors) {
            throw new ToolArgumentException(implode('; ', $errors));
        }

        return is_array($out) ? $out : [];
    }

    private static function check(array $schema, mixed $value, string $path, array &$errors): mixed
    {
        $type = $schema['type'] ?? null;
        if ($value === null && array_key_exists('default', $schema)) {
            return $schema['default'];
        }
        switch ($type) {
            case 'object':
                if (! is_array($value) || (array_is_list($value) && $value !== [])) {
                    $errors[] = "$path must be an object";

                    return [];
                }
                $props = (array) ($schema['properties'] ?? []);
                $out = [];
                foreach ($schema['required'] ?? [] as $req) {
                    if (! array_key_exists($req, $value) || $value[$req] === null || $value[$req] === '') {
                        $errors[] = "$path.$req is required";
                    }
                }
                foreach ($props as $key => $sub) {
                    $sub = (array) $sub;
                    if (array_key_exists($key, $value)) {
                        $out[$key] = self::check($sub, $value[$key], "$path.$key", $errors);
                    } elseif (array_key_exists('default', $sub)) {
                        $out[$key] = $sub['default'];
                    }
                }

                return $out;
            case 'string':
                if (is_numeric($value)) {
                    $value = (string) $value;
                }
                if (! is_string($value)) {
                    $errors[] = "$path must be a string";

                    return null;
                }
                $value = trim($value);
                if (isset($schema['maxLength']) && mb_strlen($value) > $schema['maxLength']) {
                    $errors[] = "$path must be at most {$schema['maxLength']} characters";
                }
                if (isset($schema['minLength']) && mb_strlen($value) < $schema['minLength']) {
                    $errors[] = "$path must be at least {$schema['minLength']} characters";
                }
                break;
            case 'integer':
                if (is_string($value) && preg_match('/^-?\d+$/', $value)) {
                    $value = (int) $value;
                }
                if (is_float($value) && floor($value) == $value) {
                    $value = (int) $value;
                }
                if (! is_int($value)) {
                    $errors[] = "$path must be an integer";

                    return null;
                }
                break;
            case 'number':
                if (is_string($value) && is_numeric($value)) {
                    $value = $value + 0;
                }
                if (! is_int($value) && ! is_float($value)) {
                    $errors[] = "$path must be a number";

                    return null;
                }
                break;
            case 'boolean':
                if (! is_bool($value)) {
                    $errors[] = "$path must be true or false";

                    return null;
                }
                break;
            case 'array':
                if (! is_array($value) || ! array_is_list($value)) {
                    $errors[] = "$path must be an array";

                    return [];
                }
                if (isset($schema['maxItems']) && count($value) > $schema['maxItems']) {
                    $errors[] = "$path must have at most {$schema['maxItems']} items";
                }

                return array_map(fn ($v) => isset($schema['items']) ? self::check((array) $schema['items'], $v, "{$path}[]", $errors) : $v, $value);
        }
        if (isset($schema['enum']) && ! in_array($value, $schema['enum'], true)) {
            $errors[] = "$path must be one of: " . implode(', ', $schema['enum']);
        }
        if (isset($schema['minimum']) && is_numeric($value) && $value < $schema['minimum']) {
            $errors[] = "$path must be >= {$schema['minimum']}";
        }
        if (isset($schema['maximum']) && is_numeric($value) && $value > $schema['maximum']) {
            $errors[] = "$path must be <= {$schema['maximum']}";
        }

        return $value;
    }
}
