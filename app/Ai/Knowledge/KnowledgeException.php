<?php

namespace App\Ai\Knowledge;

use RuntimeException;

/** Ingestion failure with a merchant-safe code (e.g. unsupported_type, empty_text). */
class KnowledgeException extends RuntimeException
{
    public function __construct(public readonly string $errorCode, string $message = '')
    {
        parent::__construct($message !== '' ? $message : $errorCode);
    }
}
