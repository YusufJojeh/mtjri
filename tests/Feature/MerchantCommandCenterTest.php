<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;

/**
 * Read-only merchant endpoints added for the new frontend: command-center
 * dashboard payload, global search and the inventory workspace.
 */
beforeEach(function () {
    // Plan middleware is bypassed in the "local" env; tests run as "testing".
    $this->seed([PermissionSeeder::class, RoleSeeder::class]);

    $plan = \App\Models\Plan::factory()->create();
    $this->merchant = User::factory()->create([
        'type' => 'company', 'plan_id' => $plan->id, 'plan_is_active' => 1, 'plan_expire_date' => now()->addMonth(),
    ]);
    $this->merchant->assignRole('company');
    $this->store = Store::factory()->create(['user_id' => $this->merchant->id, 'theme' => 'home-accessories']);
    $this->merchant->update(['current_store' => $this->store->id]);

    $other = User::factory()->create(['type' => 'company']);
    $this->otherStore = Store::factory()->create(['user_id' => $other->id]);

    $order = fn (Store $store, array $attrs = []) => Order::create(array_merge([
        'order_number' => 'ORD-' . strtoupper(uniqid()),
        'store_id' => $store->id,
        'status' => 'pending',
        'payment_status' => 'paid',
        'customer_email' => 'buyer@example.com',
        'customer_first_name' => 'Nora',
        'customer_last_name' => 'Ali',
        'subtotal' => 100, 'tax_amount' => 0, 'shipping_amount' => 0, 'discount_amount' => 0,
        'total_amount' => 100,
        'payment_method' => 'cod',
        'shipping_address' => '1 Test St', 'shipping_city' => 'Riyadh', 'shipping_state' => 'Riyadh', 'shipping_postal_code' => '12211', 'shipping_country' => 'SA',
        'billing_address' => '1 Test St', 'billing_city' => 'Riyadh', 'billing_state' => 'Riyadh', 'billing_postal_code' => '12211', 'billing_country' => 'SA',
    ], $attrs));

    $this->mine = $order($this->store, ['order_number' => 'ORD-MINE-1']);
    $order($this->store, ['order_number' => 'ORD-MINE-2', 'payment_status' => 'failed']);
    $this->theirs = $order($this->otherStore, ['order_number' => 'ORD-THEIRS-1', 'customer_first_name' => 'Nora']);

    // ProductFactory targets an outdated schema, so create rows directly.
    $product = fn (Store $store, string $name, int $stock) => Product::create([
        'store_id' => $store->id, 'name' => $name, 'sku' => strtoupper(uniqid()), 'price' => 50, 'stock' => $stock, 'is_active' => true, 'is_downloadable' => false,
    ]);
    $product($this->store, 'Brass Lamp', 0);
    $product($this->store, 'Linen Throw', 5);
    $product($this->otherStore, 'Brass Bowl', 50);
});

test('search is scoped to the current store', function () {
    $res = $this->actingAs($this->merchant)->getJson(route('merchant.search', ['q' => 'ORD-']))->assertOk();

    $numbers = collect($res->json('orders'))->pluck('number');
    expect($numbers)->toContain('ORD-MINE-1')->not->toContain('ORD-THEIRS-1');

    $products = collect($this->actingAs($this->merchant)->getJson(route('merchant.search', ['q' => 'Brass']))->json('products'))->pluck('name');
    expect($products->all())->toBe(['Brass Lamp']);
});

test('search hides resources the user may not view', function () {
    $staff = User::factory()->create(['type' => 'staff', 'created_by' => $this->merchant->id, 'current_store' => $this->store->id]);
    $staff->givePermissionTo('view-products');

    $res = $this->actingAs($staff)->getJson(route('merchant.search', ['q' => 'ORD']))->assertOk();
    expect($res->json('orders'))->toBe([]);
    expect($res->json('customers'))->toBe([]);
});

test('search validates input length', function () {
    $this->actingAs($this->merchant)->getJson(route('merchant.search', ['q' => str_repeat('a', 101)]))->assertStatus(422);
});

test('inventory reports real stock states and counts', function () {
    $this->actingAs($this->merchant)
        ->get(route('inventory.index', ['view' => 'out']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('inventory/index')
            ->where('counts.out', 1)
            ->where('counts.low', 1)
            ->where('counts.all', 2)
            ->has('items', 1)
            ->where('items.0.name', 'Brass Lamp')
            ->where('items.0.state', 'out_of_stock'));
});

test('dashboard command center surfaces attention items from real data', function () {
    $this->actingAs($this->merchant)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('dashboardData.commandCenter.kpis.sales')
            ->has('dashboardData.commandCenter.series', 30)
            ->where('dashboardData.commandCenter.openOrders', 2)
            ->where('dashboardData.commandCenter.attention', fn ($items) => collect($items)->pluck('id')->intersect(['payment_failed', 'ready_to_ship', 'out_of_stock', 'low_stock'])->count() === 4));
});
