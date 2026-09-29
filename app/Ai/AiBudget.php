<?php

namespace App\Ai;

use App\Ai\Providers\AiProviderException;
use App\Ai\Providers\LlmResponse;
use App\Models\Ai\AiUsageRecord;
use App\Models\Plan;
use App\Models\Setting;
use App\Models\Store;
use App\Models\User;

/**
 * Usage ledger + bounded usage. Limits apply per store (monthly tokens from
 * the plan / store setting / default), per feature (share of the monthly
 * budget) and per run (see AgentRunner).
 */
class AiBudget
{
    public function monthlyLimit(Store $store): int
    {
        $override = Setting::where('store_id', $store->id)->where('key', 'ai_monthly_token_budget')->value('value');
        if (is_numeric($override) && (int) $override > 0) {
            return (int) $override;
        }
        $owner = User::find($store->user_id);
        $plan = $owner?->plan_id ? Plan::find($owner->plan_id) : null;
        if ($plan && $plan->ai_monthly_tokens) {
            return (int) $plan->ai_monthly_tokens;
        }

        return (int) config('tijraa.budget.default_monthly_tokens');
    }

    public function usedThisMonth(Store $store, ?string $feature = null): int
    {
        return (int) AiUsageRecord::forStore($store->id)
            ->where('created_at', '>=', now()->startOfMonth())
            ->where('provider', '!=', 'local')
            ->when($feature, fn ($q) => $q->where('feature', $feature))
            ->selectRaw('COALESCE(SUM(input_tokens + output_tokens), 0) as t')->value('t');
    }

    public function summary(Store $store): array
    {
        $limit = $this->monthlyLimit($store);
        $used = $this->usedThisMonth($store);
        $features = [];
        foreach (config('tijraa.budget.feature_share') as $feature => $share) {
            $features[$feature] = ['used' => $this->usedThisMonth($store, $feature), 'limit' => (int) floor($limit * $share)];
        }

        return ['limit' => $limit, 'used' => $used, 'remaining' => max(0, $limit - $used), 'percent' => $limit ? min(100, (int) round($used / $limit * 100)) : 0, 'features' => $features, 'resets_at' => now()->addMonthNoOverflow()->startOfMonth()->toIso8601String()];
    }

    /** @throws AiProviderException budget_exhausted */
    public function assertAvailable(Store $store, string $feature): void
    {
        $limit = $this->monthlyLimit($store);
        $share = (float) (config("tijraa.budget.feature_share.$feature") ?? 1.0);
        if ($this->usedThisMonth($store) >= $limit || $this->usedThisMonth($store, $feature) >= (int) floor($limit * $share)) {
            AiUsageRecord::create(['store_id' => $store->id, 'user_id' => auth()->id(), 'feature' => $feature, 'provider' => 'none', 'status' => 'budget_blocked', 'error_code' => 'budget_exhausted']);
            throw new AiProviderException('budget_exhausted', 'Monthly AI budget reached.');
        }
    }

    public function record(Store $store, ?User $user, string $feature, string $provider, LlmResponse $res, array $extra = []): AiUsageRecord
    {
        return AiUsageRecord::create(array_merge([
            'store_id' => $store->id,
            'user_id' => $user?->id,
            'feature' => $feature,
            'provider' => $provider,
            'model' => $res->model,
            'input_tokens' => $res->inputTokens,
            'output_tokens' => $res->outputTokens,
            'cost_usd' => $this->cost($res->model, $res->inputTokens, $res->outputTokens),
            'latency_ms' => $res->latencyMs,
            'status' => 'ok',
        ], $extra));
    }

    public function recordFailure(Store $store, ?User $user, string $feature, string $provider, ?string $model, string $code, array $extra = []): void
    {
        AiUsageRecord::create(array_merge(['store_id' => $store->id, 'user_id' => $user?->id, 'feature' => $feature, 'provider' => $provider, 'model' => $model, 'status' => 'error', 'error_code' => $code], $extra));
    }

    public function cost(string $model, int $in, int $out): float
    {
        $prices = config('tijraa.ai.pricing');
        $key = collect(array_keys($prices))->first(fn ($k) => $k !== 'default' && str_starts_with($model, $k)) ?? 'default';
        [$pi, $po] = $prices[$key];

        return round(($in * $pi + $out * $po) / 1_000_000, 6);
    }
}
