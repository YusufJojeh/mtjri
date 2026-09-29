<?php

namespace App\Ai\Knowledge;

/**
 * Local, deterministic embeddings via feature hashing of word unigrams,
 * bigrams and character trigrams (sublinear TF, signed hashing, L2 norm).
 * No network, no model download; captures lexical and morphological
 * similarity. Used when no embedding provider is configured.
 */
class HashingEmbedder implements Embedder
{
    public function __construct(private readonly int $dims = 512) {}

    public function model(): string
    {
        return "tijraa-hash-{$this->dims}";
    }

    public function embed(array $texts): array
    {
        return array_map(fn ($t) => $this->vector((string) $t), $texts);
    }

    private function vector(string $text): array
    {
        $v = array_fill(0, $this->dims, 0.0);
        $tokens = Tokenizer::tokens($text);
        $features = [];
        foreach ($tokens as $i => $tok) {
            $features[] = 'w:' . $tok;
            if (isset($tokens[$i + 1])) {
                $features[] = 'b:' . $tok . '_' . $tokens[$i + 1];
            }
            $padded = '^' . $tok . '$';
            for ($j = 0, $n = mb_strlen($padded) - 2; $j < $n; $j++) {
                $features[] = 'c:' . mb_substr($padded, $j, 3);
            }
        }
        foreach (array_count_values($features) as $f => $count) {
            $h = crc32($f);
            $weight = (1 + log($count)) * (str_starts_with($f, 'c:') ? 0.35 : (str_starts_with($f, 'b:') ? 0.8 : 1.0));
            $v[$h % $this->dims] += ($h & 0x80000000) ? -$weight : $weight;
        }
        $norm = sqrt(array_sum(array_map(fn ($x) => $x * $x, $v))) ?: 1.0;

        return array_map(fn ($x) => $x / $norm, $v);
    }
}
