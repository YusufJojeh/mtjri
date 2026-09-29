<?php

namespace App\Ai\Knowledge;

/**
 * Splits text into overlapping, heading-aware chunks sized for retrieval.
 * Paragraph boundaries are preferred; long paragraphs split on sentences.
 */
class Chunker
{
    public function __construct(private readonly int $size = 900, private readonly int $overlap = 150) {}

    /** @return array<int, array{heading:?string,content:string}> */
    public function chunk(string $text): array
    {
        $blocks = preg_split("/\n\s*\n/u", $text) ?: [];
        $chunks = [];
        $heading = null;
        $buf = '';

        $flush = function () use (&$buf, &$chunks, &$heading) {
            $c = trim($buf);
            if ($c !== '') {
                $chunks[] = ['heading' => $heading, 'content' => $c];
            }
            $buf = '';
        };

        foreach ($blocks as $block) {
            $block = trim($block);
            if ($block === '') {
                continue;
            }
            if (preg_match('/^(#{1,6})\s+(.+)$/u', strtok($block, "\n"), $m) || (mb_strlen($block) < 80 && ! preg_match('/[.!?؟:]$/u', $block) && substr_count($block, "\n") === 0)) {
                $flush();
                $heading = trim($m[2] ?? $block, "# \t");
                $rest = trim(preg_replace('/^#{1,6}\s+.+\n?/u', '', $block, 1));
                if ($rest === '' || $rest === $heading) {
                    continue;
                }
                $block = $rest;
            }
            foreach ($this->pieces($block) as $piece) {
                if (mb_strlen($buf) + mb_strlen($piece) + 2 > $this->size && $buf !== '') {
                    $prev = $buf;
                    $flush();
                    $buf = $this->tail($prev);
                }
                $buf .= ($buf === '' ? '' : "\n\n") . $piece;
            }
        }
        $flush();

        return $chunks;
    }

    /** Split a long paragraph on sentence boundaries. */
    private function pieces(string $block): array
    {
        if (mb_strlen($block) <= $this->size) {
            return [$block];
        }
        $sentences = preg_split('/(?<=[.!?؟])\s+/u', $block) ?: [$block];
        $out = [];
        $cur = '';
        foreach ($sentences as $s) {
            if (mb_strlen($cur) + mb_strlen($s) + 1 > $this->size && $cur !== '') {
                $out[] = $cur;
                $cur = '';
            }
            $cur .= ($cur === '' ? '' : ' ') . $s;
            while (mb_strlen($cur) > $this->size) {
                $out[] = mb_substr($cur, 0, $this->size);
                $cur = mb_substr($cur, $this->size);
            }
        }
        if ($cur !== '') {
            $out[] = $cur;
        }

        return $out;
    }

    private function tail(string $text): string
    {
        if ($this->overlap <= 0 || mb_strlen($text) <= $this->overlap) {
            return '';
        }
        $tail = mb_substr($text, -$this->overlap);
        $space = mb_strpos($tail, ' ');

        return $space !== false ? mb_substr($tail, $space + 1) : $tail;
    }
}
