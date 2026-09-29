<?php

namespace App\Services\Notifications;

use App\Models\Ai\MerchantNotification;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Store notifications. Recipients are the store owner plus staff of that
 * company who hold the relevant permission. A dedupe key prevents repeats
 * (e.g. one low-stock alert per product per day).
 *
 * Titles/bodies are English source strings with :params, translated in the
 * UI; `params` carries interpolation values.
 */
class MerchantNotifier
{
    public const TYPES = [
        'new_order' => ['category' => 'orders', 'severity' => 'info', 'permission' => 'view-orders'],
        'payment_failed' => ['category' => 'orders', 'severity' => 'critical', 'permission' => 'view-orders'],
        'low_stock' => ['category' => 'inventory', 'severity' => 'warning', 'permission' => 'view-products'],
        'out_of_stock' => ['category' => 'inventory', 'severity' => 'critical', 'permission' => 'view-products'],
        'ai_action_ready' => ['category' => 'ai', 'severity' => 'info', 'permission' => 'view-ai-actions'],
        'ai_action_applied' => ['category' => 'ai', 'severity' => 'success', 'permission' => 'view-ai-actions'],
        'ai_action_failed' => ['category' => 'ai', 'severity' => 'critical', 'permission' => 'view-ai-actions'],
        'knowledge_ready' => ['category' => 'knowledge', 'severity' => 'success', 'permission' => 'view-knowledge'],
        'knowledge_failed' => ['category' => 'knowledge', 'severity' => 'critical', 'permission' => 'view-knowledge'],
        'discount_expiring' => ['category' => 'discounts', 'severity' => 'warning', 'permission' => 'view-coupon-system'],
        'system_issue' => ['category' => 'system', 'severity' => 'critical', 'permission' => null],
    ];

    public static function notify(Store $store, string $type, string $title, ?string $body = null, array $params = [], ?string $url = null, ?string $dedupeKey = null, ?int $dedupeHours = null): int
    {
        $meta = self::TYPES[$type] ?? ['category' => 'system', 'severity' => 'info', 'permission' => null];
        $created = 0;
        foreach (self::recipients($store, $meta['permission']) as $user) {
            if ($dedupeKey) {
                $exists = MerchantNotification::where('user_id', $user->id)->where('dedupe_key', $dedupeKey)
                    ->when($dedupeHours, fn ($q) => $q->where('created_at', '>=', now()->subHours($dedupeHours)))
                    ->exists();
                if ($exists) {
                    continue;
                }
            }
            MerchantNotification::create([
                'store_id' => $store->id,
                'user_id' => $user->id,
                'type' => $type,
                'category' => $meta['category'],
                'severity' => $meta['severity'],
                'title' => $title,
                'body' => $body,
                'params' => $params,
                'url' => $url ? self::relative($url) : null,
                'dedupe_key' => $dedupeKey,
            ]);
            $created++;
        }

        return $created;
    }

    /** @return Collection<int, User> */
    public static function recipients(Store $store, ?string $permission): Collection
    {
        $owner = User::find($store->user_id);
        $staff = User::where('created_by', $store->user_id)->where('type', '!=', 'company')->get()
            ->filter(fn (User $u) => ! $permission || $u->can($permission));

        return collect([$owner])->filter()->merge($staff)->unique('id')->values();
    }

    /** Store only path+query so links work behind any host. */
    private static function relative(string $url): string
    {
        $p = parse_url($url);

        return ($p['path'] ?? '/') . (isset($p['query']) ? '?' . $p['query'] : '') . (isset($p['fragment']) ? '#' . $p['fragment'] : '');
    }
}
