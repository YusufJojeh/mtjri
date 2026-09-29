<?php

namespace App\Ai\Knowledge;

interface Embedder
{
    /** Identifier stored on each chunk; vectors from different models are never compared. */
    public function model(): string;

    /**
     * @param string[] $texts
     * @return array<int, float[]> L2-normalised vectors
     */
    public function embed(array $texts): array;
}
