<?php

namespace App\Contracts;

interface OpenAIContentGenerator
{
    public function generateText(string $prompt, string $userLanguage, array $options = []): array;
}
