<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Services\AIOrchestratorService;

class ChatGptController extends Controller
{
    public function __construct(
        private readonly AIOrchestratorService $aiOrchestratorService
    ) {
    }

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'prompt' => 'required|string|max:1000',
            'language' => 'string|in:en,es,ar,da,de,fr,he,it,ja,nl,pl,pt,pt-BR,ru,tr,zh',
            'creativity' => 'string|in:low,medium,high',
            'num_results' => 'integer|min:1|max:5',
            'max_length' => 'integer|min:1|max:500',
            'provider' => 'nullable|string|in:openai,ollama',
            'agentic' => 'nullable|boolean',
        ]);

        try {
            $temperature = (float) $request->input('creativity', 0.7);
            if (is_string($request->input('creativity'))) {
                $temperature = match($request->input('creativity')) {
                    'low' => 0.3,
                    'high' => 0.9,
                    default => 0.7
                };
            }
            
            $language = $request->input('language', 'en');
            $langText = $language !== 'en' ? "Provide response in " . match($language) {
                'es' => 'Spanish',
                'ar' => 'Arabic',
                'da' => 'Danish',
                'de' => 'German',
                'fr' => 'French',
                'he' => 'Hebrew',
                'it' => 'Italian',
                'ja' => 'Japanese',
                'nl' => 'Dutch',
                'pl' => 'Polish',
                'pt' => 'Portuguese',
                'pt-BR' => 'Brazilian Portuguese',
                'ru' => 'Russian',
                'tr' => 'Turkish',
                'zh' => 'Chinese',
                default => 'English'
            } . " language.\n\n " : "";

            $maxTokens = (int) $request->input('max_length', 150);
            $maxResults = (int) $request->input('num_results', 1);
            $orchestrated = $this->aiOrchestratorService->generateChatResponse(
                $request->prompt . ' ' . $langText,
                [
                    'provider' => $request->input('provider'),
                    'agentic' => $request->has('agentic') ? (bool) $request->boolean('agentic') : null,
                    'temperature' => $temperature,
                    'max_tokens' => $maxTokens,
                    'n' => $maxResults,
                ]
            );

            if (!$orchestrated['success']) {
                return response()->json([
                    'success' => false,
                    'error_code' => $orchestrated['error_code'] ?? 'tool_failed',
                    'message' => $orchestrated['error_message'] ?? __('Text was not generated, please try again'),
                ], 422);
            }

            $choices = $orchestrated['choices'] ?? [];
            $text = '';
            $counter = 1;
            if (count($choices) > 1) {
                foreach ($choices as $choice) {
                    $text .= $counter . '. ' . trim($choice) . "\r\n\r\n\r\n";
                    $counter++;
                }
            } else {
                $text = (string) ($orchestrated['content'] ?? '');
            }

            return response()->json([
                'success' => true,
                'content' => trim($text),
                'provider' => $orchestrated['provider'] ?? null,
                'steps' => $orchestrated['steps'] ?? [],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
}
