<?php

namespace App\Ai\Knowledge;

final class Vectors
{
    public static function pack(array $v): string
    {
        return base64_encode(pack('g*', ...$v));
    }

    public static function unpack(?string $s): ?array
    {
        if (! $s) {
            return null;
        }
        $raw = base64_decode($s, true);

        return $raw === false ? null : array_values(unpack('g*', $raw));
    }

    public static function cosine(array $a, array $b): float
    {
        $n = min(count($a), count($b));
        $dot = 0.0;
        $na = 0.0;
        $nb = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $dot += $a[$i] * $b[$i];
            $na += $a[$i] * $a[$i];
            $nb += $b[$i] * $b[$i];
        }

        return ($na > 0 && $nb > 0) ? $dot / (sqrt($na) * sqrt($nb)) : 0.0;
    }
}
