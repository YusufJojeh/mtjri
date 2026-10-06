<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class AIOrchestratorService
{
    public function __construct(
        private readonly AIProviderManager $providerManager
    ) {
    }

    public function generateChatResponse(string $prompt, array $options = []): array
    {
        $provider = $this->providerManager->resolveProvider($options['provider'] ?? null);
        $agenticEnabled = $this->providerManager->isAgenticEnabled($options['agentic'] ?? null);
        $maxSteps = max(1, (int) config('ai.max_steps', 4));
        $maxChars = max(1000, (int) config('ai.max_content_chars', 12000));

        if (!$agenticEnabled) {
            return $this->runSingleGeneration($prompt, $provider, $options);
        }

        $steps = [];
        $currentPrompt = $prompt;
        $lastError = null;

        for ($step = 1; $step <= $maxSteps; $step++) {
            $generation = $this->runToolGenerateText($currentPrompt, $provider, $options, $step);
            $steps[] = $generation['step_log'];

            if (!$generation['result']['success']) {
                $lastError = $generation['result'];
                break;
            }

            $validateStart = microtime(true);
            $content = trim((string) $generation['result']['content']);
            $valid = $content !== '' && mb_strlen($content) <= $maxChars;

            $validateDurationMs = (int) ((microtime(true) - $validateStart) * 1000);
            $validateStep = $this->buildStepLog($step, 'validate_output', $validateDurationMs, $provider, $valid, $valid ? null : 'invalid_output');
            $steps[] = $validateStep;

            if ($valid) {
                return [
                    'success' => true,
                    'provider' => $provider,
                    'choices' => $generation['result']['choices'],
                    'content' => $content,
                    'error_code' => null,
                    'error_message' => null,
                    'steps' => $steps,
                ];
            }

            $repairStart = microtime(true);
            $currentPrompt = $this->buildRepairPrompt($currentPrompt, $content);
            $repairDurationMs = (int) ((microtime(true) - $repairStart) * 1000);
            $steps[] = $this->buildStepLog($step, 'repair_output', $repairDurationMs, $provider, true);
        }

        $errorCode = $lastError['error_code'] ?? 'invalid_output';
        $errorMessage = $lastError['error_message'] ?? 'Failed to generate a valid response.';

        return [
            'success' => false,
            'provider' => $provider,
            'choices' => [],
            'content' => '',
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
            'steps' => $steps,
        ];
    }

    public function generateStructuredContent(string $prompt, array $defaults = [], array $options = []): array
    {
        $provider = $this->providerManager->resolveProvider($options['provider'] ?? null);
        $agenticEnabled = $this->providerManager->isAgenticEnabled($options['agentic'] ?? null);
        $maxSteps = max(1, (int) config('ai.max_steps', 4));
        $steps = [];

        if (!$agenticEnabled) {
            $single = $this->runSingleGeneration($prompt, $provider, $options);
            if (!$single['success']) {
                return $single;
            }

            $decoded = json_decode((string) $single['content'], true);
            if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
                return [
                    'success' => false,
                    'provider' => $provider,
                    'content' => [],
                    'choices' => [],
                    'error_code' => 'invalid_output',
                    'error_message' => 'Provider output is not valid JSON.',
                    'steps' => $single['steps'] ?? [],
                ];
            }

            return [
                'success' => true,
                'provider' => $provider,
                'content' => $this->mergeWithDefaults($defaults, $decoded),
                'choices' => $single['choices'] ?? [],
                'error_code' => null,
                'error_message' => null,
                'steps' => $single['steps'] ?? [],
            ];
        }

        $currentPrompt = $prompt;
        $lastError = null;

        for ($step = 1; $step <= $maxSteps; $step++) {
            $generation = $this->runToolGenerateText($currentPrompt, $provider, $options, $step);
            $steps[] = $generation['step_log'];

            if (!$generation['result']['success']) {
                $lastError = $generation['result'];
                break;
            }

            $validateStart = microtime(true);
            $decoded = json_decode((string) $generation['result']['content'], true);
            $valid = json_last_error() === JSON_ERROR_NONE && is_array($decoded);
            $validateDurationMs = (int) ((microtime(true) - $validateStart) * 1000);

            $steps[] = $this->buildStepLog($step, 'validate_output', $validateDurationMs, $provider, $valid, $valid ? null : 'invalid_output');

            if ($valid) {
                $mergeStart = microtime(true);
                $merged = $this->mergeWithDefaults($defaults, $decoded);
                $mergeDurationMs = (int) ((microtime(true) - $mergeStart) * 1000);
                $steps[] = $this->buildStepLog($step, 'merge_with_defaults', $mergeDurationMs, $provider, true);

                if (isset($options['fetch_supporting_image']) && is_callable($options['fetch_supporting_image'])) {
                    $imageStart = microtime(true);
                    $imageResult = ($options['fetch_supporting_image'])($merged);
                    if (is_array($imageResult)) {
                        $merged = array_replace_recursive($merged, $imageResult);
                    }
                    $imageDurationMs = (int) ((microtime(true) - $imageStart) * 1000);
                    $steps[] = $this->buildStepLog($step, 'fetch_supporting_image', $imageDurationMs, $provider, true);
                }

                return [
                    'success' => true,
                    'provider' => $provider,
                    'content' => $merged,
                    'choices' => $generation['result']['choices'],
                    'error_code' => null,
                    'error_message' => null,
                    'steps' => $steps,
                ];
            }

            $repairStart = microtime(true);
            $currentPrompt = $this->buildRepairJsonPrompt($currentPrompt, (string) $generation['result']['content']);
            $repairDurationMs = (int) ((microtime(true) - $repairStart) * 1000);
            $steps[] = $this->buildStepLog($step, 'repair_output', $repairDurationMs, $provider, true);
        }

        $errorCode = $lastError['error_code'] ?? 'invalid_output';
        $errorMessage = $lastError['error_message'] ?? 'Failed to generate valid structured output.';

        return [
            'success' => false,
            'provider' => $provider,
            'content' => [],
            'choices' => [],
            'error_code' => $errorCode,
            'error_message' => $errorMessage,
            'steps' => $steps,
        ];
    }

    private function runSingleGeneration(string $prompt, string $provider, array $options): array
    {
        $tool = $this->runToolGenerateText($prompt, $provider, $options, 1);

        $result = $tool['result'];
        return [
            'success' => $result['success'],
            'provider' => $provider,
            'choices' => $result['choices'] ?? [],
            'content' => $result['content'] ?? '',
            'error_code' => $result['error_code'] ?? null,
            'error_message' => $result['error_message'] ?? null,
            'steps' => [$tool['step_log']],
        ];
    }

    private function runToolGenerateText(string $prompt, string $provider, array $options, int $step): array
    {
        $start = microtime(true);
        $client = $this->providerManager->getClient($provider);
        $result = $client->generateText($prompt, $options);

        if (!$result['success'] && $provider !== 'openai' && $this->providerManager->isFallbackToOpenAIEnabled()) {
            $fallbackStart = microtime(true);
            $fallbackClient = $this->providerManager->getClient('openai');
            $fallbackResult = $fallbackClient->generateText($prompt, $options);
            $fallbackDurationMs = (int) ((microtime(true) - $fallbackStart) * 1000);
            $fallbackStep = $this->buildStepLog($step, 'generate_text', $fallbackDurationMs, 'openai', $fallbackResult['success'], $fallbackResult['error_code'] ?? null);
            $this->logStep($fallbackStep);

            return [
                'result' => $fallbackResult,
                'step_log' => $fallbackStep,
            ];
        }

        $durationMs = (int) ((microtime(true) - $start) * 1000);
        $stepLog = $this->buildStepLog($step, 'generate_text', $durationMs, $provider, $result['success'], $result['error_code'] ?? null);
        $this->logStep($stepLog);

        return [
            'result' => $result,
            'step_log' => $stepLog,
        ];
    }

    private function mergeWithDefaults(array $defaults, array $content): array
    {
        if ($defaults === []) {
            return $content;
        }

        return array_replace_recursive($defaults, $content);
    }

    private function buildRepairPrompt(string $prompt, string $invalidOutput): string
    {
        return "Your previous answer was invalid or empty.\n\nOriginal prompt:\n{$prompt}\n\nPrevious output:\n{$invalidOutput}\n\nPlease provide a concise, valid response only.";
    }

    private function buildRepairJsonPrompt(string $prompt, string $invalidOutput): string
    {
        return "Your previous output is not valid JSON.\n\nOriginal prompt:\n{$prompt}\n\nPrevious output:\n{$invalidOutput}\n\nReturn only valid JSON that matches the requested structure.";
    }

    private function buildStepLog(int $step, string $tool, int $durationMs, string $provider, bool $success, ?string $errorCode = null): array
    {
        return [
            'step' => $step,
            'tool' => $tool,
            'duration_ms' => $durationMs,
            'provider' => $provider,
            'success' => $success,
            'error_code' => $errorCode,
        ];
    }

    private function logStep(array $step): void
    {
        Log::info('ai.agent.step', $step);
    }
}

