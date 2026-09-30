<?php

namespace Tests\Feature\Tijraa;

use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

/** Shared fixtures for Tijraa platform tests: two isolated merchants. */
final class Setup
{
    public static function merchant(string $email = null): array
    {
        static $seeded = false;
        if (! $seeded || ! \Spatie\Permission\Models\Role::where('name', 'company')->exists()) {
            (new PermissionSeeder)->run();
            (new RoleSeeder)->run();
            $seeded = true;
        }
        $plan = Plan::factory()->create();
        $user = User::factory()->create([
            'type' => 'company', 'plan_id' => $plan->id, 'plan_is_active' => 1, 'plan_expire_date' => now()->addMonth(),
        ] + ($email ? ['email' => $email] : []));
        $user->assignRole('company');
        $store = Store::factory()->create(['user_id' => $user->id, 'theme' => 'home-accessories']);
        $user->update(['current_store' => $store->id]);

        return [$user->fresh(), $store];
    }

    public static function product(Store $store, string $name = 'Brass Lamp', int $stock = 30, string $description = 'Lamp.'): Product
    {
        return Product::create([
            'store_id' => $store->id, 'name' => $name, 'sku' => strtoupper(uniqid()), 'price' => 50, 'stock' => $stock,
            'is_active' => true, 'is_downloadable' => false, 'description' => $description,
        ]);
    }
}
