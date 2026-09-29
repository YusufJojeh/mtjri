<?php

namespace App\Ai\Knowledge;

use App\Ai\Providers\AiProviderException;
use GuzzleHttp\Client as Guzzle;
use OpenAI;

class OpenAiEmbedder implements Embedder
{
    public function __construct(private readonly string $apiKey, private readonly string $model = 'text-embedding-3-small') {}

    public function model(): string
    {
        return 'openai:' . $this->model;
    }

    public function embed(array $texts): array
    {
        try {
            $client = OpenAI::factory()->withApiKey($this->apiKey)->withHttpClient(new Guzzle(['timeout' => 60]))->make();
            $out = [];
            foreach (array_chunk($texts, 64) as $batch) {
                $res = $client->embeddings()->create(['model' => $this->model, 'input' => array_values($batch)]);
                foreach ($res->embeddings as $e) {
                    $out[] = $e->embedding;
                }
            }

            return $out;
        } catch (\Throwable $e) {
            throw AiProviderException::fromThrowable($e);
        }
    }
}
