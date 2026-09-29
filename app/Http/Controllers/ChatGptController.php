<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Setting;
use OpenAI;

class ChatGptController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'prompt' => 'required|string|max:1000',
            'language' => 'string|in:en,es,ar,da,de,fr,he,it,ja,nl,pl,pt,pt-BR,ru,tr,zh',
            'creativity' => 'string|in:low,medium,high',
            'num_results' => 'integer|min:1|max:5',
            'max_length' => 'integer|min:1|max:500'
        ]);

        try {
            $apiKey = Setting::where('key', 'chatgptKey')->value('value');
            $model = Setting::where('key', 'chatgptModel')->value('value') ?? 'gpt-3.5-turbo';
            
            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'code' => 'not_configured',
                    'message' => __('Please set proper configuration for Api Key')
                ]);
            }

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

            $client = OpenAI::client($apiKey);
            
            $response = $client->chat()->create([
                'model' => $model,
                'messages' => [
                    [
                        'role' => 'user',
                        'content' => $request->prompt . ' ' . $langText
                    ]
                ],
                'max_tokens' => $maxTokens,
                'temperature' => $temperature,
                'n' => $maxResults
            ]);

            if (isset($response->choices)) {
                $text = '';
                $counter = 1;
                
                if (count($response->choices) > 1) {
                    foreach ($response->choices as $choice) {
                        $text .= $counter . '. ' . trim($choice->message->content) . "\r\n\r\n\r\n";
                        $counter++;
                    }
                } else {
                    $text = $response->choices[0]->message->content;
                }

                return response()->json([
                    'success' => true,
                    'content' => trim($text)
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'code' => 'empty_response',
                    'message' => __('Text was not generated, please try again')
                ]);
            }

        } catch (\Exception $e) {
            // Never leak provider/internal exception text to merchants.
            \Illuminate\Support\Facades\Log::warning('AI generation failed', ['error' => $e->getMessage()]);

            $raw = strtolower($e->getMessage());
            $code = match (true) {
                str_contains($raw, 'rate limit') || str_contains($raw, 'too many requests') => 'rate_limited',
                str_contains($raw, 'quota') || str_contains($raw, 'billing') || str_contains($raw, 'insufficient') => 'budget_exhausted',
                str_contains($raw, 'api key') || str_contains($raw, 'unauthorized') || str_contains($raw, 'authentication') => 'not_configured',
                default => 'provider_error',
            };

            return response()->json([
                'success' => false,
                'code' => $code,
                'message' => __('The AI service could not complete this request. Please try again shortly.')
            ]);
        }
    }
}