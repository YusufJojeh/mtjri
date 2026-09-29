<?php

namespace App\Ai\Knowledge;

/** Language-aware tokenisation for English and Arabic retrieval. */
final class Tokenizer
{
    private const STOP = ['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'is', 'are', 'be', 'with', 'as', 'at', 'by', 'it', 'this', 'that', 'we', 'our', 'you', 'your', 'from', 'do', 'does', 'what', 'how', 'can', 'i', 'my', 'me',
        'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'ما', 'هل', 'أن', 'التي', 'الذي', 'كيف', 'و'];

    /** @return string[] */
    public static function tokens(string $text): array
    {
        $text = mb_strtolower(self::normaliseArabic($text));
        preg_match_all('/[\p{L}\p{N}]+/u', $text, $m);

        return array_values(array_filter(array_map([self::class, 'stem'], $m[0]), fn ($t) => mb_strlen($t) > 1 && ! in_array($t, self::STOP, true)));
    }

    public static function normaliseArabic(string $text): string
    {
        $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{0640}]/u', '', $text); // harakat + tatweel
        $text = str_replace(['أ', 'إ', 'آ'], 'ا', $text);
        $text = str_replace('ى', 'ي', $text);

        return str_replace('ة', 'ه', $text);
    }

    /** Light suffix stripping (plural/possessive) — keeps it predictable. */
    private static function stem(string $t): string
    {
        if (preg_match('/^\p{Arabic}+$/u', $t)) {
            if (mb_strlen($t) > 4 && str_starts_with($t, 'ال')) {
                $t = mb_substr($t, 2);
            }

            return $t;
        }
        foreach (['ies' => 'y', 'es' => '', 's' => ''] as $suf => $rep) {
            if (mb_strlen($t) > 4 && str_ends_with($t, $suf) && ! str_ends_with($t, 'ss')) {
                return mb_substr($t, 0, -mb_strlen($suf)) . $rep;
            }
        }

        return $t;
    }
}
