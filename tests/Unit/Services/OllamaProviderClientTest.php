<?php

namespace Tests\Unit\Services;

use App\Services\OllamaProviderClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OllamaProviderClientTest extends TestCase
{
    public function test_it_maps_successful_ollama_response(): void
    {
        Http::fake([
            'http://127.0.0.1:11434/api/generate' => Http::response([
                'response' => 'Hello from Ollama',
            ], 200),
        ]);

        $client = $this->app->make(OllamaProviderClient::class);
        $result = $client->generateText('hi', [
            'base_url' => 'http://127.0.0.1:11434',
            'model' => 'llama3.1:8b',
            'timeout_ms' => 60000,
        ]);

        $this->assertTrue($result['success']);
        $this->assertSame('ollama', $result['provider']);
        $this->assertSame('Hello from Ollama', $result['content']);
    }

    public function test_it_maps_ollama_model_not_found_error(): void
    {
        Http::fake([
            'http://127.0.0.1:11434/api/generate' => Http::response([
                'error' => 'model "missing-model" not found',
            ], 404),
        ]);

        $client = $this->app->make(OllamaProviderClient::class);
        $result = $client->generateText('hi', [
            'base_url' => 'http://127.0.0.1:11434',
            'model' => 'missing-model',
        ]);

        $this->assertFalse($result['success']);
        $this->assertSame('model_not_found', $result['error_code']);
    }
}

