<?php

namespace App\Ai\Providers;

use RuntimeException;

/**
 * Provider failure mapped to a merchant-safe code. The message is for logs
 * only and must never be shown to merchants.
 */
class AiProviderException extends RuntimeException
{
    public function __construct(public readonly string $errorCode, string $message = '', ?\Throwable $previous = null)
    {
        parent::__construct($message !== '' ? $message : $errorCode, 0, $previous);
    }

    public static function fromThrowable(\Throwable $e): self
    {
        $raw = strtolower($e->getMessage());
        $code = match (true) {
            str_contains($raw, 'rate limit') || str_contains($raw, '429') || str_contains($raw, 'too many') => 'rate_limited',
            str_contains($raw, 'quota') || str_contains($raw, 'billing') || str_contains($raw, 'insufficient') || str_contains($raw, 'credit') => 'budget_exhausted',
            str_contains($raw, 'api key') || str_contains($raw, '401') || str_contains($raw, 'unauthorized') || str_contains($raw, 'authentication') => 'not_configured',
            str_contains($raw, 'timed out') || str_contains($raw, 'timeout') => 'timeout',
            default => 'provider_error',
        };

        return new self($code, $e->getMessage(), $e);
    }
}
