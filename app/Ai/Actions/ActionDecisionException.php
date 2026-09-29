<?php

namespace App\Ai\Actions;

use RuntimeException;

class ActionDecisionException extends RuntimeException
{
    public function __construct(public readonly string $errorCode, string $message)
    {
        parent::__construct($message);
    }

    public function status(): int
    {
        return match ($this->errorCode) {
            'forbidden' => 403,
            'already_decided', 'stale', 'payload_mismatch' => 409,
            'expired' => 410,
            default => 422,
        };
    }
}
