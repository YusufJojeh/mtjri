<?php

namespace App\Services;

use App\Contracts\OpenAIContentGenerator;
use Illuminate\Support\Facades\Log;

class OpenAIContentGeneratorService implements OpenAIContentGenerator
{
    public function __construct(
        private readonly AIOrchestratorService $aiOrchestratorService
    ) {
    }

    public function generateText(string $prompt, string $userLanguage, array $options = []): array
    {
        $generation = $this->aiOrchestratorService->generateStructuredContent(
            $prompt,
            $options['defaults'] ?? [],
            array_merge(
                [
                    'provider' => $options['provider'] ?? null,
                    'agentic' => $options['agentic'] ?? null,
                    'temperature' => $options['temperature'] ?? 0.7,
                    'max_tokens' => $options['max_tokens'] ?? 500,
                    'n' => 1,
                ],
                $options
            )
        );

        if (!$generation['success']) {
            Log::error('AI structured generation failed', [
                'error_code' => $generation['error_code'] ?? null,
                'error_message' => $generation['error_message'] ?? null,
                'provider' => $generation['provider'] ?? null,
            ]);
            return ['error' => $generation['error_message'] ?? 'AI generation failed'];
        }

        return is_array($generation['content']) ? $generation['content'] : [];
    }
}
