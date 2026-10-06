<?php

namespace App\Support;

use Illuminate\Http\Request;

class MediaReference
{
    public static function normalizeForStorage(?string $value, ?Request $request = null): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim($value);

        if ($value === '') {
            return null;
        }

        if (!self::isAbsoluteUrl($value)) {
            return self::normalizeRelativePath($value);
        }

        if (!self::isAllowedAbsoluteUrl($value, $request)) {
            return null;
        }

        $parts = parse_url($value);

        if ($parts === false) {
            return null;
        }

        $path = $parts['path'] ?? '';
        $query = isset($parts['query']) ? '?' . $parts['query'] : '';
        $fragment = isset($parts['fragment']) ? '#' . $parts['fragment'] : '';

        return self::normalizeRelativePath($path . $query . $fragment);
    }

    public static function normalizeCsvForStorage(?string $value, ?Request $request = null): ?string
    {
        if ($value === null) {
            return null;
        }

        $items = array_filter(array_map(
            static fn (string $item): ?string => self::normalizeForStorage($item, $request),
            explode(',', $value)
        ));

        return empty($items) ? null : implode(',', $items);
    }

    public static function isAllowedReference(string $value, ?Request $request = null): bool
    {
        if ($value === '') {
            return true;
        }

        if (!self::isAbsoluteUrl($value)) {
            return true;
        }

        return self::isAllowedAbsoluteUrl($value, $request);
    }

    public static function isAllowedAbsoluteUrl(string $value, ?Request $request = null): bool
    {
        $parts = parse_url($value);

        if ($parts === false) {
            return false;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $host = strtolower(trim((string) ($parts['host'] ?? ''), '[]'));

        if (!in_array($scheme, ['http', 'https'], true) || $host === '') {
            return false;
        }

        return in_array($host, self::allowedHosts($request), true);
    }

    public static function allowedHosts(?Request $request = null): array
    {
        $hosts = [
            'localhost',
            '127.0.0.1',
            '::1',
        ];

        $requestHost = $request?->getHost();
        if ($requestHost) {
            $hosts[] = strtolower(trim($requestHost, '[]'));
        }

        $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);
        if (is_string($appHost) && $appHost !== '') {
            $hosts[] = strtolower(trim($appHost, '[]'));
        }

        $extraHosts = array_filter(array_map('trim', explode(',', (string) env('ALLOWED_MEDIA_HOSTS', ''))));
        foreach ($extraHosts as $host) {
            $hosts[] = strtolower(trim($host, '[]'));
        }

        return array_values(array_unique(array_filter($hosts)));
    }

    public static function publicPathFromStorage(?string $value): ?string
    {
        $normalized = self::normalizeForStorage($value);

        if ($normalized === null || $normalized === '') {
            return $normalized;
        }

        if (str_starts_with($normalized, '/storage/')) {
            return $normalized;
        }

        if (str_starts_with($normalized, 'storage/')) {
            return '/' . $normalized;
        }

        return '/storage/' . ltrim($normalized, '/');
    }

    private static function normalizeRelativePath(string $value): string
    {
        $value = preg_replace('#(?<!:)/{2,}#', '/', trim($value)) ?? trim($value);

        if ($value === '') {
            return '';
        }

        if (str_starts_with($value, '/')) {
            return $value;
        }

        return '/' . ltrim($value, '/');
    }

    private static function isAbsoluteUrl(string $value): bool
    {
        return preg_match('/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//', $value) === 1;
    }
}
