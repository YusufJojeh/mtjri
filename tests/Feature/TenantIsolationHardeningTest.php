<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Permission;
use App\Models\Plan;
use App\Models\Role;
use App\Models\Store;
use App\Models\User;
use App\PathGenerators\MediaPathGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class TenantIsolationHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_staff_can_only_see_their_company_stores(): void
    {
        $previous = User::$skipStoreCreation;
        User::$skipStoreCreation = true;
        try {
            $manageStores = $this->makePermission('manage-stores', 'Stores');
            $viewStores = $this->makePermission('view-stores', 'Stores');
            $staffRole = $this->makeRole('company_staff', 'Company Staff', [$manageStores, $viewStores]);
            $plan = Plan::factory()->create([
                'is_default' => true,
                'is_plan_enable' => true,
                'price' => 0,
                'yearly_price' => 0,
                'max_stores' => 5,
                'max_users_per_store' => 10,
                'max_products_per_store' => 50,
            ]);

            $owner = User::factory()->create([
                'type' => 'company',
                'plan_id' => $plan->id,
                'plan_is_active' => 1,
                'plan_expire_date' => null,
            ]);
            $otherOwner = User::factory()->create(['type' => 'company']);

            $ownerStore = Store::factory()->create([
                'user_id' => $owner->id,
                'name' => 'Owner Store',
                'slug' => 'owner-store',
            ]);

            Store::factory()->create([
                'user_id' => $owner->id,
                'name' => 'Second Owner Store',
                'slug' => 'second-owner-store',
            ]);

            Store::factory()->create([
                'user_id' => $otherOwner->id,
                'name' => 'Other Store',
                'slug' => 'other-store',
            ]);

            $staff = User::factory()->create([
                'type' => 'user',
                'created_by' => $owner->id,
            ]);
            $staff->assignRole($staffRole);

            $response = $this->actingAs($staff)->get(route('stores.index'));

            $response
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('stores/index')
                    ->has('stores.data', 2)
                );

            $this->assertStringContainsString('Owner Store', $response->getContent());
            $this->assertStringNotContainsString('Other Store', $response->getContent());
        } finally {
            User::$skipStoreCreation = $previous;
        }
    }

    public function test_newsletter_subscription_rejects_unknown_store_slug(): void
    {
        Store::factory()->create([
            'user_id' => User::factory()->create(['type' => 'company'])->id,
            'slug' => 'valid-store',
        ]);

        $response = $this->postJson(route('api.newsletter.subscribe'), [
            'email' => 'guest@example.com',
            'store_slug' => 'missing-store',
        ]);

        $response->assertStatus(404);
        $this->assertDatabaseMissing('newsletter_subscriptions', [
            'email' => 'guest@example.com',
        ]);
    }

    public function test_store_checkout_rejects_mismatched_store_id(): void
    {
        $store = Store::factory()->create([
            'user_id' => User::factory()->create(['type' => 'company'])->id,
            'slug' => 'checkout-store',
            'is_active' => true,
        ]);

        $otherStore = Store::factory()->create([
            'user_id' => User::factory()->create(['type' => 'company'])->id,
            'slug' => 'other-checkout-store',
            'is_active' => true,
        ]);

        $response = $this->post(route('store.order.place', ['storeSlug' => $store->slug]), [
            'store_id' => $otherStore->id,
            'customer_first_name' => 'Jane',
            'customer_last_name' => 'Doe',
            'customer_email' => 'jane@example.com',
            'customer_phone' => '123456789',
            'shipping_address' => 'Street 1',
            'shipping_city' => 'City',
            'shipping_state' => 'State',
            'shipping_postal_code' => '12345',
            'shipping_country' => 'Country',
            'billing_address' => 'Street 1',
            'billing_city' => 'City',
            'billing_state' => 'State',
            'billing_postal_code' => '12345',
            'billing_country' => 'Country',
            'payment_method' => 'cash',
        ]);

        $response->assertSessionHasErrors('store_id');
    }

    public function test_track_order_lookup_stays_within_the_current_store(): void
    {
        $owner = User::factory()->create(['type' => 'company']);
        $otherOwner = User::factory()->create(['type' => 'company']);

        $store = Store::factory()->create([
            'user_id' => $owner->id,
            'slug' => 'track-store',
            'is_active' => true,
        ]);

        $otherStore = Store::factory()->create([
            'user_id' => $otherOwner->id,
            'slug' => 'other-track-store',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number' => 'ORD-TRACK-1',
            'store_id' => $store->id,
            'status' => 'shipped',
            'payment_status' => 'paid',
            'customer_email' => 'track@example.com',
            'customer_first_name' => 'Track',
            'customer_last_name' => 'User',
            'shipping_address' => 'Street 1',
            'shipping_city' => 'City',
            'shipping_state' => 'State',
            'shipping_postal_code' => '12345',
            'shipping_country' => 'Country',
            'billing_address' => 'Street 1',
            'billing_city' => 'City',
            'billing_state' => 'State',
            'billing_postal_code' => '12345',
            'billing_country' => 'Country',
            'subtotal' => 100,
            'tax_amount' => 0,
            'shipping_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => 100,
            'payment_method' => 'cash',
        ]);

        $hit = $this->get(route('store.track-order', [
            'storeSlug' => $store->slug,
            'order_number' => $order->order_number,
            'email' => $order->customer_email,
        ]));

        $hit
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/track-order')
                ->where('order.order_number', 'ORD-TRACK-1')
            );

        $miss = $this->get(route('store.track-order', [
            'storeSlug' => $otherStore->slug,
            'order_number' => $order->order_number,
            'email' => $order->customer_email,
        ]));

        $miss
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('store/track-order')
                ->where('order', null)
            );
    }

    public function test_media_path_generator_uses_tenant_scoped_paths_when_available(): void
    {
        $generator = new MediaPathGenerator();

        $tenantMedia = new Media();
        $tenantMedia->id = 10;
        $tenantMedia->model_id = 42;
        $tenantMedia->custom_properties = [
            'tenant_company_id' => 7,
            'tenant_store_id' => 3,
        ];

        $legacyMedia = new Media();
        $legacyMedia->id = 11;
        $legacyMedia->model_id = 99;
        $legacyMedia->custom_properties = [];

        $this->assertSame('tenants/company-7/store-3/media/10/', $generator->getPath($tenantMedia));
        $this->assertSame('tenants/company-7/store-3/media/10/conversions/', $generator->getPathForConversions($tenantMedia));
        $this->assertSame('media/99/', $generator->getPath($legacyMedia));
    }

    private function makePermission(string $name, string $module): Permission
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return Permission::firstOrCreate(
            ['name' => $name, 'guard_name' => 'web'],
            [
                'module' => $module,
                'label' => str($name)->replace('-', ' ')->title()->toString(),
                'description' => $name,
            ]
        );
    }

    private function makeRole(string $name, string $label, array $permissions = []): Role
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $role = Role::firstOrCreate(
            ['name' => $name, 'guard_name' => 'web'],
            [
                'label' => $label,
                'description' => $label,
            ]
        );

        if (!empty($permissions)) {
            $role->syncPermissions($permissions);
        }

        return $role;
    }
}
