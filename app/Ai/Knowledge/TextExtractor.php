<?php

namespace App\Ai\Knowledge;

use ZipArchive;

/**
 * Plain-text extraction for merchant documents. Output is data only; no
 * markup, scripts or links survive extraction.
 */
class TextExtractor
{
    public function extract(string $path, string $extension): string
    {
        $ext = strtolower($extension);
        $text = match ($ext) {
            'txt', 'md', 'markdown', 'csv' => (string) file_get_contents($path),
            'json' => $this->json((string) file_get_contents($path)),
            'html', 'htm' => $this->html((string) file_get_contents($path)),
            'docx' => $this->docx($path),
            'pdf' => $this->pdf((string) file_get_contents($path)),
            default => throw new KnowledgeException('unsupported_type', "Unsupported file type: {$ext}"),
        };
        $text = $this->normalise($text);
        if (mb_strlen(trim($text)) < 20) {
            throw new KnowledgeException('empty_text', 'No readable text was found in this document.');
        }

        return $text;
    }

    public function normalise(string $text): string
    {
        if (! mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', 'Windows-1256,ISO-8859-1');
        }
        $text = preg_replace('/^\xEF\xBB\xBF/', '', $text);
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[^\P{C}\n\t]/u', '', $text) ?? $text; // strip control chars
        $text = preg_replace("/[ \t]+/u", ' ', $text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        return trim($text);
    }

    private function json(string $raw): string
    {
        $data = json_decode($raw, true);
        if (! is_array($data)) {
            return $raw;
        }
        $lines = [];
        array_walk_recursive($data, function ($v, $k) use (&$lines) {
            if (is_scalar($v)) {
                $lines[] = (is_string($k) ? $k . ': ' : '') . $v;
            }
        });

        return implode("\n", $lines);
    }

    private function html(string $html): string
    {
        $html = preg_replace('#<(script|style|noscript)[^>]*>.*?</\1>#is', ' ', $html);
        $html = preg_replace('#<(br|/p|/div|/li|/h[1-6]|/tr)[^>]*>#i', "\n", $html);
        $html = preg_replace('#<h([1-6])[^>]*>#i', "\n\n# ", $html);

        return html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    private function docx(string $path): string
    {
        $zip = new ZipArchive();
        if ($zip->open($path) !== true) {
            throw new KnowledgeException('unreadable', 'The document could not be opened.');
        }
        $xml = $zip->getFromName('word/document.xml');
        $zip->close();
        if ($xml === false) {
            throw new KnowledgeException('unreadable', 'This is not a valid DOCX file.');
        }
        $xml = preg_replace('#</w:p>#', "\n", $xml);
        $xml = preg_replace('#<w:tab/>#', "\t", $xml);

        return html_entity_decode(strip_tags($xml), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    /**
     * Best-effort PDF text: inflates Flate streams and reads Tj/TJ string
     * operators. Scanned or CID-encoded PDFs yield no text and fail with
     * `empty_text` rather than producing garbage.
     */
    private function pdf(string $raw): string
    {
        if (! str_starts_with($raw, '%PDF')) {
            throw new KnowledgeException('unreadable', 'This is not a valid PDF file.');
        }
        $out = [];
        preg_match_all('#stream\r?\n(.*?)\r?\nendstream#s', $raw, $streams);
        foreach ($streams[1] as $stream) {
            $data = @gzuncompress($stream);
            if ($data === false) {
                $data = @gzinflate($stream);
            }
            if ($data === false) {
                $data = $stream;
            }
            if (! preg_match('/\b(Tj|TJ)\b/', $data)) {
                continue;
            }
            preg_match_all('/(\[(?:[^\]]*)\]\s*TJ|\((?:\\\\.|[^\\\\)])*\)\s*Tj|T\*|Td|TD|ET)/s', $data, $ops);
            $line = '';
            foreach ($ops[0] as $op) {
                if (preg_match('/(T\*|Td|TD|ET)$/', $op)) {
                    if (trim($line) !== '') {
                        $out[] = $line;
                    }
                    $line = '';

                    continue;
                }
                preg_match_all('/\(((?:\\\\.|[^\\\\)])*)\)/s', $op, $parts);
                foreach ($parts[1] as $p) {
                    $line .= stripcslashes($p);
                }
            }
            if (trim($line) !== '') {
                $out[] = $line;
            }
        }
        $text = implode("\n", $out);
        // Reject binary noise from undecodable fonts.
        $printable = preg_match_all('/[\p{L}\p{N}\s.,;:!?\'"()-]/u', $text);
        if ($text === '' || $printable < mb_strlen($text) * 0.7) {
            throw new KnowledgeException('empty_text', 'This PDF has no extractable text (it may be scanned). Upload a text, Word or Markdown version instead.');
        }

        return $text;
    }
}
