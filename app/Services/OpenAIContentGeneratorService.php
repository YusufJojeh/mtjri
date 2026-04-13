<?php

namespace App\Services;

use App\Contracts\OpenAIContentGenerator;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use OpenAI;

class OpenAIContentGeneratorService implements OpenAIContentGenerator
{
    public function generateText(string $prompt, string $userLanguage, int $retries = 0): array
    {
        try {
            $apiKey = Setting::getGlobal('chatgptKey');
            $model = Setting::getGlobal('chatgptModel') ?? 'gpt-3.5-turbo';

            if (!$apiKey) {
                Log::error('OpenAI API key not set in settings.');
                return [];
            }

            $client = OpenAI::client($apiKey);

            $response = $client->chat()->create([
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'max_tokens' => 500,
                'temperature' => 0.7,
                'n' => 1
            ]);

            if (isset($response->choices[0]->message->content)) {
                $content = json_decode($response->choices[0]->message->content, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $content;
                } else {
                    Log::error('OpenAI returned invalid JSON: ' . $response->choices[0]->message->content);
                    return ['error' => 'Invalid JSON from OpenAI'];
                }
            }
            Log::warning('OpenAI did not return any content for prompt: ' . $prompt);
            return [];

        } catch (\Exception $e) {
            Log::error('OpenAI API error: ' . $e->getMessage() . ' for prompt: ' . $prompt);
            if ($retries < config('openai.max_retries', 3)) {
                sleep(2);
                return $this->generateText($prompt, $userLanguage, $retries + 1);
            }
            return ['error' => 'OpenAI API failed after multiple retries.'];
        }
    }
}

