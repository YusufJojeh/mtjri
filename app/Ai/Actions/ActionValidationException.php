<?php

namespace App\Ai\Actions;

use RuntimeException;

class ActionValidationException extends RuntimeException
{
    public function __construct(public readonly array $errors)
    {
        parent::__construct(implode('; ', $errors));
    }
}
