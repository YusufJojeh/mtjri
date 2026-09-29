<?php

namespace App\Services\Commerce;

use App\Models\Ai\KnowledgeDocument;
use App\Models\Ai\StoreOnboardingStep;
use App\Models\CustomPage;
use App\Models\Product;
use App\Models\Shipping;
use App\Models\Store;
use App\Models\User;

/**
 * Merchant setup journey. Most steps are derived from real store data (a
 * product exists, a payment method is enabled…). Optional steps can be
 * skipped, and "AI preferences" is saved here.
 */
class StoreOnboarding
{
    public const STEPS = ['identity', 'brand', 'products', 'payments', 'shipping', 'policies', 'domain', 'knowledge', 'ai_preferences', 'go_live'];

    public const REQUIRED = ['identity', 'products', 'payments', 'shipping', 'go_live'];

    public const SKIPPABLE = ['brand', 'policies', 'domain', 'knowledge', 'ai_preferences'];

    public function __construct(private readonly Store $store) {}

    public static function for(Store|int $store): self
    {
        return new self($store instanceof Store ? $store : Store::findOrFail($store));
    }

    /** @return array<int, array{id:string,status:string,required:bool,detail:array,href:?string}> */
    public function steps(): array
    {
        $s = $this->store;
        $saved = StoreOnboardingStep::forStore($s->id)->get()->keyBy('step');
        $derived = [
            'identity' => filled($s->name) && filled($s->description),
            'brand' => filled($s->logo) || filled($s->color),
            'products' => Product::where('store_id', $s->id)->where('is_active', true)->exists(),
            'payments' => $this->paymentsEnabled(),
            'shipping' => Shipping::where('store_id', $s->id)->where('is_active', true)->exists(),
            'policies' => $this->hasPolicies(),
            'domain' => (bool) ($s->enable_custom_domain || $s->enable_custom_subdomain),
            'knowledge' => KnowledgeDocument::forStore($s->id)->where('status', KnowledgeDocument::READY)->exists(),
            'ai_preferences' => false,
            'go_live' => false,
        ];
        $hrefs = [
            'identity' => route('stores.edit', $s->id),
            'brand' => route('stores.edit', $s->id),
            'products' => route('products.create'),
            'payments' => route('settings') . '#payment-settings',
            'shipping' => route('shipping.index'),
            'policies' => route('custom-pages.index'),
            'domain' => route('stores.edit', $s->id),
            'knowledge' => route('knowledge.index'),
            'ai_preferences' => null,
            'go_live' => null,
        ];

        $steps = [];
        foreach (self::STEPS as $id) {
            $row = $saved[$id] ?? null;
            $status = $derived[$id] ? 'done' : ($row?->status === 'completed' ? 'done' : ($row?->status === 'skipped' ? 'skipped' : 'todo'));
            $steps[$id] = [
                'id' => $id,
                'status' => $status,
                'required' => in_array($id, self::REQUIRED, true),
                'skippable' => in_array($id, self::SKIPPABLE, true),
                'derived' => $derived[$id],
                'detail' => $row?->data ?? [],
                'href' => $hrefs[$id],
            ];
        }

        $requiredBeforeLaunch = array_diff(self::REQUIRED, ['go_live']);
        $ready = collect($requiredBeforeLaunch)->every(fn ($id) => $steps[$id]['status'] === 'done');
        $steps['go_live']['status'] = ($ready && $s->is_active) ? 'done' : 'todo';
        $steps['go_live']['detail'] = ['ready' => $ready, 'store_active' => (bool) $s->is_active, 'store_url' => url('/store/' . $s->slug)];

        return array_values($steps);
    }

    public function progress(): array
    {
        $steps = $this->steps();
        $finished = collect($steps)->filter(fn ($s) => $s['status'] !== 'todo')->count();

        return ['completed' => $finished, 'total' => count($steps), 'percent' => (int) round($finished / count($steps) * 100), 'next' => collect($steps)->firstWhere('status', 'todo')['id'] ?? null];
    }

    public function skip(string $step, User $user): void
    {
        abort_unless(in_array($step, self::SKIPPABLE, true), 422, 'This step cannot be skipped.');
        StoreOnboardingStep::updateOrCreate(['store_id' => $this->store->id, 'step' => $step], ['status' => 'skipped', 'completed_by' => $user->id]);
    }

    public function complete(string $step, User $user, array $data = []): void
    {
        abort_unless(in_array($step, ['policies', 'ai_preferences', 'brand'], true), 422, 'This step completes automatically.');
        StoreOnboardingStep::updateOrCreate(['store_id' => $this->store->id, 'step' => $step], ['status' => 'completed', 'data' => $data, 'completed_by' => $user->id]);
    }

    public function reopen(string $step): void
    {
        StoreOnboardingStep::forStore($this->store->id)->where('step', $step)->delete();
    }

    /** Merchant-chosen AI preferences (tone, language) used by Copilot and content tools. */
    public function aiPreferences(): array
    {
        $row = StoreOnboardingStep::forStore($this->store->id)->where('step', 'ai_preferences')->first();

        return array_merge(['tone' => 'friendly', 'language' => 'auto', 'emoji' => false], $row?->data ?? []);
    }

    private function paymentsEnabled(): bool
    {
        if ($this->store->pay_with_whatsapp) {
            return true;
        }
        $settings = (array) getPaymentSettings($this->store->user_id, $this->store->id);
        foreach ($settings as $key => $value) {
            if (preg_match('/^is_[a-z0-9_]+_enabled$/', (string) $key) && ($value === true || $value === '1' || $value === 1 || $value === 'on')) {
                return true;
            }
        }

        return false;
    }

    private function hasPolicies(): bool
    {
        $page = CustomPage::where('store_id', $this->store->id)->where(function ($q) {
            foreach (['return', 'refund', 'shipping', 'privacy', 'terms', 'policy', 'سياسة', 'الاسترجاع'] as $w) {
                $q->orWhere('title', 'like', "%{$w}%")->orWhere('slug', 'like', "%{$w}%");
            }
        })->exists();

        return $page || KnowledgeDocument::forStore($this->store->id)->where('status', KnowledgeDocument::READY)->whereIn('doc_type', ['returns_policy', 'shipping_policy'])->exists();
    }
}
