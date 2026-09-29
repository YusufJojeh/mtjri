<?php

namespace App\Ai\Actions;

use App\Models\Store;
use App\Models\StoreCoupon;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;

/**
 * Creates a store discount. Mirrors StoreCouponController@store validation
 * and adds AI guard-rails: percentage ≤ 50%, both dates required (checkout
 * only honours dated codes), duration ≤ 60 days.
 */
class DiscountCreateAction extends ActionType
{
    public function type(): string { return 'discount_create'; }

    public function permission(): string { return 'create-coupon-system'; }

    public function risk(array $payload): string
    {
        return ($payload['type'] === 'percentage' && $payload['value'] > 25) || ($payload['type'] === 'flat' && $payload['value'] > 50) ? 'high' : 'medium';
    }

    public function validate(Store $store, array $payload): array
    {
        $e = [];
        $name = trim((string) ($payload['name'] ?? ''));
        $code = strtoupper(preg_replace('/[^A-Za-z0-9_-]/', '', (string) ($payload['code'] ?? '')));
        $type = $payload['type'] ?? '';
        $value = is_numeric($payload['value'] ?? null) ? round((float) $payload['value'], 2) : null;
        if ($name === '' || mb_strlen($name) > 255) $e[] = 'name is required (max 255)';
        if (strlen($code) < 3 || strlen($code) > 50) $e[] = 'code must be 3-50 letters/numbers';
        elseif (StoreCoupon::where('code', $code)->exists()) $e[] = "code {$code} is already used";
        if (! in_array($type, ['percentage', 'flat'], true)) $e[] = 'type must be percentage or flat';
        if ($value === null || $value <= 0) $e[] = 'value must be greater than 0';
        if ($type === 'percentage' && $value !== null && $value > 50) $e[] = 'percentage discounts proposed by AI are capped at 50%';
        $min = isset($payload['minimum_spend']) && $payload['minimum_spend'] !== '' ? round((float) $payload['minimum_spend'], 2) : null;
        if ($min !== null && $min < 0) $e[] = 'minimum_spend must be >= 0';
        if ($type === 'flat' && $min !== null && $value !== null && $value >= $min && $min > 0) $e[] = 'a flat discount must be smaller than the minimum spend';
        $limit = isset($payload['usage_limit']) && $payload['usage_limit'] !== '' ? (int) $payload['usage_limit'] : null;
        if ($limit !== null && $limit < 1) $e[] = 'usage_limit must be at least 1';
        $perUser = isset($payload['per_customer_limit']) && $payload['per_customer_limit'] !== '' ? (int) $payload['per_customer_limit'] : null;
        if ($perUser !== null && $perUser < 1) $e[] = 'per_customer_limit must be at least 1';
        try {
            $start = Carbon::parse($payload['start_date'] ?? '')->startOfDay();
            $end = Carbon::parse($payload['end_date'] ?? '')->startOfDay();
            if ($start->lt(today())) $e[] = 'start_date cannot be in the past';
            if ($end->lt($start)) $e[] = 'end_date must be on or after start_date';
            if ($start->diffInDays($end) > 60) $e[] = 'discount window must be 60 days or less';
        } catch (\Throwable) {
            $e[] = 'start_date and end_date are required (YYYY-MM-DD)';
            $start = $end = null;
        }
        if ($e) {
            throw new ActionValidationException($e);
        }

        return array_filter([
            'name' => $name,
            'code' => $code,
            'type' => $type,
            'value' => $value,
            'minimum_spend' => $min,
            'usage_limit' => $limit,
            'per_customer_limit' => $perUser,
            'start_date' => $start->toDateString(),
            'end_date' => $end->toDateString(),
            'description' => isset($payload['description']) ? Str::limit(trim((string) $payload['description']), 500, '') : null,
        ], fn ($v) => $v !== null);
    }

    public function resource(Store $store, array $payload): array
    {
        return ['type' => 'discount', 'id' => null, 'label' => $payload['code'], 'url' => route('coupon-system.index')];
    }

    public function preview(Store $store, array $payload): array
    {
        $f = fn ($key, $label, $after, $format = 'text') => ['key' => $key, 'label' => $label, 'before' => null, 'after' => $after, 'format' => $format, 'editable' => false];

        return [
            'kind' => 'discount',
            'summary' => [
                'type' => $payload['type'], 'value' => $payload['value'], 'minimum_spend' => $payload['minimum_spend'] ?? null,
                'start_date' => $payload['start_date'], 'end_date' => $payload['end_date'], 'usage_limit' => $payload['usage_limit'] ?? null,
            ],
            'fields' => array_values(array_filter([
                $f('name', 'Name', $payload['name']),
                $f('code', 'Code', $payload['code'], 'code'),
                $f('value', $payload['type'] === 'percentage' ? 'Percentage off' : 'Amount off', $payload['value'], $payload['type'] === 'percentage' ? 'percent' : 'money'),
                $f('minimum_spend', 'Minimum order', $payload['minimum_spend'] ?? null, 'money'),
                $f('usage_limit', 'Total uses allowed', $payload['usage_limit'] ?? null, 'number'),
                $f('per_customer_limit', 'Uses per customer', $payload['per_customer_limit'] ?? null, 'number'),
                $f('start_date', 'Starts', $payload['start_date'], 'date'),
                $f('end_date', 'Ends', $payload['end_date'], 'date'),
            ], fn ($x) => $x['after'] !== null)),
        ];
    }

    public function stateFingerprint(Store $store, array $payload): ?string
    {
        return null; // creation: nothing to go stale, uniqueness re-checked at execution
    }

    public function execute(Store $store, User $user, array $payload): array
    {
        if (StoreCoupon::where('code', $payload['code'])->exists()) {
            throw new ActionValidationException(["code {$payload['code']} is already used"]);
        }
        $c = StoreCoupon::create([
            'name' => $payload['name'],
            'code' => $payload['code'],
            'description' => $payload['description'] ?? null,
            'code_type' => 'manual',
            'type' => $payload['type'],
            'discount_amount' => $payload['value'],
            'minimum_spend' => $payload['minimum_spend'] ?? null,
            'use_limit_per_coupon' => $payload['usage_limit'] ?? null,
            'use_limit_per_user' => $payload['per_customer_limit'] ?? null,
            'start_date' => $payload['start_date'],
            'expiry_date' => $payload['end_date'],
            'status' => true,
            'store_id' => $store->id,
            'created_by' => $user->id,
        ]);

        return ['discount_id' => $c->id, 'code' => $c->code, 'url' => route('coupon-system.show', $c->id)];
    }
}
