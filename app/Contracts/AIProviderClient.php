<?php

namespace App\Contracts;

interface AIProviderClient
{
    public function providerName(): string;

    /**
     * @return array{
     *     success: bool,
     *     provider: string,
     *     content: string,
     *     choices: array<int,string>,
     *     error_code: string|null,
     *     error_message: string|null
     * }
     */
    public function generateText(string $prompt, array $options = []): array;
}

