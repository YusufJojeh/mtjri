<?php

namespace App\Ai\Providers;

/**
 * Deterministic, rule-based stand-in for a language model.
 *
 * It exists so the full agent loop (tool selection, approvals, same-run
 * resume, events, UI) can be exercised in local development and E2E tests
 * without provider credentials. It is refused in production by AiManager and
 * always labelled as a test model in the UI.
 *
 * It only ever uses the tools it is offered and branches on the tool results
 * it receives (e.g. no declining products → no discount proposal), so it
 * exercises the same contract a real model does. It is NOT intelligent and
 * must never be presented as such.
 */
class ScriptedProvider implements LlmProvider
{
    private const NOTE = '[Tijraa platform update';

    private int $seq = 0;

    public function name(): string
    {
        return 'scripted';
    }

    public function model(): string
    {
        return 'scripted';
    }

    public function chat(array $messages, array $tools = [], array $options = []): LlmResponse
    {
        if ($tools === []) {
            return $this->draftText($messages);
        }
        $available = array_column($tools, 'name');
        [$merchant, $turn] = $this->currentTurn($messages);
        $arabic = (bool) preg_match('/\p{Arabic}/u', $merchant);
        $calls = $this->callsInTurn($turn);
        $finalOnly = $available === ['respond_to_merchant'];

        if (! $finalOnly) {
            foreach ($this->intents($merchant) as $intent) {
                $next = $this->nextStep($intent, $merchant, $calls, $available);
                if ($next === 'done') {
                    continue;
                }
                if ($next !== null) {
                    return $this->respond($messages, [$next]);
                }
            }
        }

        return $this->respond($messages, [[
            'name' => 'respond_to_merchant',
            'arguments' => $this->answer($calls, $turn, $arabic),
        ]]);
    }

    /** Latest merchant message and every message after it. */
    private function currentTurn(array $messages): array
    {
        for ($i = count($messages) - 1; $i >= 0; $i--) {
            $m = $messages[$i];
            if (($m['role'] ?? '') === 'user' && ! str_starts_with((string) ($m['content'] ?? ''), self::NOTE)) {
                return [(string) $m['content'], array_slice($messages, $i + 1)];
            }
        }

        return ['', []];
    }

    /** @return array<string, array{args:array, result:string}> keyed by tool name */
    private function callsInTurn(array $turn): array
    {
        $byId = [];
        $calls = [];
        foreach ($turn as $m) {
            foreach ($m['tool_calls'] ?? [] as $c) {
                $byId[$c['id']] = $c['name'];
                $calls[$c['name']] = ['args' => $c['arguments'] ?? [], 'result' => ''];
            }
            if (($m['role'] ?? '') === 'tool' && isset($byId[$m['tool_call_id'] ?? ''])) {
                $calls[$byId[$m['tool_call_id']]]['result'] = (string) ($m['content'] ?? '');
            }
        }

        return $calls;
    }

    private function intents(string $text): array
    {
        $t = mb_strtolower($text);
        $found = [];
        $patterns = [
            'seo' => '/\bseo\b|meta|search engine|سيو|محركات البحث|البحث/u',
            'discount' => '/discount|coupon|promo|sale|خصم|كوبون|تخفيض|عرض/u',
            'copy' => '/description|copy|rewrite|وصف|صياغة/u',
            'knowledge' => '/brand|policy|return|refund|shipping policy|knowledge|هوية|سياسة|استرجاع|استرداد/u',
        ];
        foreach ($patterns as $intent => $re) {
            if (preg_match($re, $t, $m, PREG_OFFSET_CAPTURE)) {
                $found[$intent] = $m[0][1];
            }
        }
        asort($found);
        $intents = array_keys($found);

        return $intents ?: ['analysis'];
    }

    /** @return array|string|null next call, 'done', or null (nothing possible) */
    private function nextStep(string $intent, string $merchant, array $calls, array $available): array|string|null
    {
        $plan = match ($intent) {
            'discount' => [['get_declining_products', []], ['search_knowledge', ['query' => 'discount campaign promotion rules']]],
            'seo' => [['get_seo_status', []], ['search_knowledge', ['query' => 'brand voice tone']]],
            'copy' => [['get_content_status', []], ['search_knowledge', ['query' => 'brand voice tone']]],
            'knowledge' => [['search_knowledge', ['query' => mb_substr($merchant, 0, 280)]]],
            default => [['get_commerce_insights', []], ['get_dashboard_metrics', []]],
        };
        foreach ($plan as [$tool, $args]) {
            if (in_array($tool, $available, true) && ! isset($calls[$tool])) {
                return ['name' => $tool, 'arguments' => $args];
            }
        }

        $proposal = match ($intent) {
            'discount' => $this->discountProposal($calls),
            'seo' => $this->seoProposal($calls),
            'copy' => $this->copyProposal($calls),
            default => null,
        };
        if ($proposal === null || ! in_array($proposal['name'], $available, true)) {
            return 'done';
        }

        $prior = $calls[$proposal['name']] ?? null;
        if ($prior === null) {
            return $proposal;
        }
        // One corrective retry when validation says the code is taken.
        if ($intent === 'discount' && str_contains($prior['result'], 'already used') && ! str_ends_with((string) ($prior['args']['code'] ?? ''), now()->format('md'))) {
            $proposal['arguments']['code'] = mb_substr($proposal['arguments']['code'], 0, 22) . now()->format('md');

            return $proposal;
        }

        return 'done';
    }

    private function discountProposal(array $calls): ?array
    {
        $r = $calls['get_declining_products']['result'] ?? '';
        if (! preg_match('/"product_id":(\d+),"name":"((?:[^"\\\\]|\\\\.)*)"/u', $r, $m)) {
            return null; // no evidence → no discount
        }
        $name = json_decode('"' . $m[2] . '"') ?: 'products';
        $code = 'PUSH' . strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $name) ?: 'SALE', 0, 6)) . '15';

        return ['name' => 'propose_discount', 'arguments' => [
            'name' => mb_substr("Sales push: {$name}", 0, 120),
            'code' => $code,
            'type' => 'percentage',
            'value' => 15,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(14)->toDateString(),
            'goal' => 'Recover sales of products whose units dropped over the last 30 days.',
            'rationale' => "Store data shows {$name} sold noticeably fewer units than the previous 30 days.",
        ]];
    }

    private function seoProposal(array $calls): ?array
    {
        $r = $calls['get_seo_status']['result'] ?? '';
        if (! preg_match('/"blog_id":(\d+),"title":"((?:[^"\\\\]|\\\\.)*)"/u', $r, $m)) {
            return null;
        }
        $title = (string) (json_decode('"' . $m[2] . '"') ?: 'Blog post');

        return ['name' => 'propose_blog_seo', 'arguments' => [
            'blog_id' => (int) $m[1],
            'meta_title' => mb_substr($title, 0, 60),
            'meta_description' => mb_substr("Read {$title} — practical ideas and products from our store.", 0, 160),
            'goal' => 'Give search engines a clear title and description for this post.',
            'rationale' => 'Store data shows this post is missing search metadata.',
        ]];
    }

    private function copyProposal(array $calls): ?array
    {
        $r = $calls['get_content_status']['result'] ?? '';
        if (! preg_match('/"product_id":(\d+),"name":"((?:[^"\\\\]|\\\\.)*)"/u', $r, $m)) {
            return null;
        }
        $name = (string) (json_decode('"' . $m[2] . '"') ?: 'This product');

        return ['name' => 'propose_product_copy', 'arguments' => [
            'product_id' => (int) $m[1],
            'field' => 'description',
            'text' => "{$name} is made to be used every day.\n\nIt combines practical design with quality materials, so it fits naturally into your home.",
            'goal' => 'Replace a thin product description with clearer copy.',
            'rationale' => 'Store data shows this product has a very short description.',
        ]];
    }

    private function answer(array $calls, array $turn, bool $ar): array
    {
        $findings = [];
        if (preg_match_all('/"title":"((?:[^"\\\\]|\\\\.)*)","description"/u', $calls['get_commerce_insights']['result'] ?? '', $m)) {
            foreach (array_slice($m[1], 0, 3) as $t) {
                $findings[] = ['text' => (string) json_decode('"' . $t . '"'), 'source' => 'store_data'];
            }
        }
        if (preg_match('/"product_id":\d+,"name":"((?:[^"\\\\]|\\\\.)*)"/u', $calls['get_declining_products']['result'] ?? '', $m)) {
            $findings[] = ['text' => ($ar ? 'انخفضت مبيعات ' : 'Sales dropped for ') . json_decode('"' . $m[1] . '"'), 'source' => 'store_data'];
        }
        if (preg_match('/"excerpt":"((?:[^"\\\\]|\\\\.){1,200})/u', $calls['search_knowledge']['result'] ?? '', $m)) {
            $findings[] = ['text' => mb_substr((string) json_decode('"' . rtrim($m[1], '\\') . '"'), 0, 200), 'source' => 'knowledge'];
        }

        $notes = array_values(array_filter($turn, fn ($x) => ($x['role'] ?? '') === 'user' && str_starts_with((string) ($x['content'] ?? ''), self::NOTE)));
        $last = $notes ? (string) end($notes)['content'] : '';
        $proposed = array_values(array_filter(array_keys($calls), fn ($n) => str_starts_with($n, 'propose_')));

        if (str_contains($last, 'APPROVED')) {
            $summary = $ar ? 'تم تطبيق التغيير الذي وافقت عليه بنجاح.' : 'The change you approved has been applied.';
        } elseif (str_contains($last, 'REJECTED')) {
            $summary = $ar ? 'حسنًا، لم يتم تطبيق التغيير.' : 'Understood — that change was not applied.';
        } elseif ($proposed) {
            $summary = $ar ? 'جهزت تغييرًا لمراجعتك في مركز إجراءات الذكاء الاصطناعي.' : 'I prepared a change for your review in the AI Action Center.';
        } elseif ($findings) {
            $summary = $ar ? 'إليك أهم ما تُظهره بيانات متجرك الآن.' : 'Here is what your store data shows right now.';
        } else {
            $summary = $ar ? 'لم أجد بيانات كافية لتقديم توصية مبنية على الأدلة.' : 'I did not find enough evidence in your store data to recommend a change.';
        }

        return [
            'executive_answer' => $summary,
            'key_findings' => array_slice($findings, 0, 6),
            'recommended_actions' => [],
            'follow_up_questions' => [],
        ];
    }

    /** Content drafting (no tools): deterministic copy built only from the provided facts. */
    private function draftText(array $messages): LlmResponse
    {
        $prompt = (string) (collect($messages)->last()['content'] ?? '');
        preg_match('/Resource: (.+?) \(/u', $prompt, $r);
        $name = trim($r[1] ?? 'This product');
        $usesKnowledge = str_contains($prompt, '[K1]');
        if (str_contains($prompt, 'Write SEO metadata')) {
            $text = "Title: " . mb_substr($name, 0, 55) . "\nDescription: " . mb_substr("Discover {$name}. Thoughtfully chosen, clearly described and ready to order today.", 0, 155) . "\nKeywords: " . mb_strtolower($name) . ', shop online, home, gifts, quality';
        } else {
            $text = "{$name} is chosen for everyday use and made to last.\n\nIt brings a practical, well-finished touch to your home, and is easy to pair with the rest of your space.";
        }
        $text .= "\nUsed: " . ($usesKnowledge ? 'K1' : 'none');
        $in = (int) ceil(mb_strlen(json_encode($messages, JSON_UNESCAPED_UNICODE)) / 4);

        return new LlmResponse($text, [], $in, (int) ceil(mb_strlen($text) / 4), 'scripted', 'stop');
    }

    private function respond(array $messages, array $calls): LlmResponse
    {
        $in = (int) ceil(mb_strlen(json_encode($messages, JSON_UNESCAPED_UNICODE)) / 4);
        $out = [];
        foreach ($calls as $c) {
            $out[] = ['id' => 'scripted_' . (++$this->seq) . '_' . substr(md5(json_encode($messages)), 0, 8), 'name' => $c['name'], 'arguments' => $c['arguments']];
        }

        return new LlmResponse(null, $out, $in, (int) ceil(mb_strlen(json_encode($out)) / 4), 'scripted', 'tool_calls');
    }
}
