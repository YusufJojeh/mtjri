<?php

namespace App\Ai\Actions;

final class Html
{
    /** Plain text → escaped paragraphs (AI output is never trusted as HTML). */
    public static function fromText(string $text): string
    {
        $paras = preg_split("/\n{2,}/", str_replace("\r", '', trim($text))) ?: [];

        return implode('', array_map(fn ($p) => '<p>' . nl2br(htmlspecialchars(trim($p), ENT_QUOTES | ENT_HTML5, 'UTF-8'), false) . '</p>', array_filter($paras, fn ($p) => trim($p) !== '')));
    }

    public static function toText(?string $html): string
    {
        $html = preg_replace('#<(br|/p|/div|/li)[^>]*>#i', "\n", (string) $html);

        return trim(preg_replace("/\n{3,}/", "\n\n", html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
    }
}
