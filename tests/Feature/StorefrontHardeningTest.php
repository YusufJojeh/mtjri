<?php

namespace Tests\Feature;

use App\Http\Requests\CategoryRequest;
use App\Http\Requests\ProductFormRequest;
use App\Models\Category;
use App\Models\Permission;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Store;
use App\Models\StoreConfiguration;
use App\Models\Tax;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class StorefrontHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_product_request_rejects_cross_store_category_and_tax_ids(): void
    {
        [$user, $store] = $this->makeCompanyUserWithStore();
        [, $otherStore] = $this->makeCompanyUserWithStore('other-store');

        $otherCategory = Category::create([
            'name' => 'Other Category',
            'slug' => 'other-category',
            'store_id' => $otherStore->id,
            'is_active' => true,
        ]);

        $otherTax = Tax::create([
            'name' => 'Other Tax',
            'rate' => 5,
            'type' => 'percentage',
            'store_id' => $otherStore->id,
            'is_active' => true,
        ]);

        $this->actingAs($user);

        $validator = Validator::make([
            'name' => 'Tenant Product',
            'price' => 99,
            'stock' => 10,
            'category_id' => $otherCategory->id,
            'tax_id' => $otherTax->id,
        ], (new ProductFormRequest())->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('category_id', $validator->errors()->toArray());
        $this->assertArrayHasKey('tax_id', $validator->errors()->toArray());
    }

    public function test_product_request_allows_same_store_category_and_tax_ids(): void
    {
        [$user, $store] = $this->makeCompanyUserWithStore();

        $category = Category::create([
            'name' => 'Store Category',
            'slug' => 'store-category',
            'store_id' => $store->id,
            'is_active' => true,
        ]);

        $tax = Tax::create([
            'name' => 'Store Tax',
            'rate' => 5,
            'type' => 'percentage',
            'store_id' => $store->id,
            'is_active' => true,
        ]);

        $this->actingAs($user);

        $validator = Validator::make([
            'name' => 'Tenant Product',
            'price' => 99,
            'stock' => 10,
            'category_id' => $category->id,
            'tax_id' => $tax->id,
        ], (new ProductFormRequest())->rules());

        $this->assertFalse($validator->fails());
    }

    public function test_category_request_rejects_cross_store_parent_category(): void
    {
        [$user] = $this->makeCompanyUserWithStore();
        [, $otherStore] = $this->makeCompanyUserWithStore('other-parent-store');

        $otherParent = Category::create([
            'name' => 'Other Parent',
            'slug' => 'other-parent',
            'store_id' => $otherStore->id,
            'is_active' => true,
        ]);

        $this->actingAs($user);

        $validator = Validator::make([
            'name' => 'Child Category',
            'parent_id' => $otherParent->id,
            'slug' => 'child-category',
        ], (new CategoryRequest())->rules());

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('parent_id', $validator->errors()->toArray());
    }

    public function test_category_slug_is_unique_per_store_only(): void
    {
        [$user, $store] = $this->makeCompanyUserWithStore();
        [, $otherStore] = $this->makeCompanyUserWithStore('other-slug-store');

        Category::create([
            'name' => 'Main Category',
            'slug' => 'shared-slug',
            'store_id' => $store->id,
            'is_active' => true,
        ]);

        Category::create([
            'name' => 'Other Store Category',
            'slug' => 'shared-slug',
            'store_id' => $otherStore->id,
            'is_active' => true,
        ]);

        $this->expectException(QueryException::class);

        Category::create([
            'name' => 'Duplicate In Same Store',
            'slug' => 'shared-slug',
            'store_id' => $store->id,
            'is_active' => true,
        ]);
    }

    public function test_product_store_persists_specifications_variants_and_normalized_media(): void
    {
        [$user, $store] = $this->makeCompanyUserWithStore();
        $this->grantPermissions($user, ['create-products']);
        $this->withoutMiddleware();

        $category = Category::create([
            'name' => 'Apparel',
            'slug' => 'apparel',
            'store_id' => $store->id,
            'is_active' => true,
        ]);

        $tax = Tax::create([
            'name' => 'VAT',
            'rate' => 15,
            'type' => 'percentage',
            'store_id' => $store->id,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->post(route('products.store'), [
            'name' => 'Normalized Product',
            'sku' => 'SKU-100',
            'description' => 'Description',
            'specifications' => 'Real specifications',
            'details' => 'More details',
            'price' => '149.99',
            'sale_price' => '99.99',
            'stock' => 7,
            'cover_image' => 'http://127.0.0.1:8000/storage/products/cover.jpg',
            'images' => 'http://127.0.0.1:8000/storage/products/one.jpg,/storage/products/two.jpg',
            'category_id' => $category->id,
            'tax_id' => $tax->id,
            'is_active' => true,
            'variants' => [
                ['name' => 'Color', 'options' => ['Red', 'Blue'], 'quantity' => 5],
            ],
            'custom_fields' => [
                ['name' => 'Material', 'value' => 'Cotton'],
            ],
        ]);

        $response->assertRedirect(route('products.index'));

        $product = Product::firstOrFail();

        $this->assertSame($store->id, $product->store_id);
        $this->assertSame('Real specifications', $product->specifications);
        $this->assertSame('/storage/products/cover.jpg', $product->cover_image);
        $this->assertSame('/storage/products/one.jpg,/storage/products/two.jpg', $product->images);
        $this->assertIsArray($product->variants);
        $this->assertSame('Color', $product->variants[0]['name']);
    }

    public function test_registration_step2_syncs_uploaded_logo_to_store_configuration(): void
    {
        Storage::fake('public');

        [$user, $store] = $this->makeCompanyUserWithStore();

        $response = $this
            ->actingAs($user)
            ->withSession(['registration_store_id' => $store->id])
            ->post(route('register.stepper.step2'), [
                'name_en' => 'Tenant Store',
                'name_ar' => 'متجر تجريبي',
                'industry' => 'fashion',
                'logo' => UploadedFile::fake()->image('logo.png'),
                'pay_with_whatsapp' => false,
            ]);

        $response->assertOk();

        $store->refresh();
        $configuration = StoreConfiguration::getConfiguration($store->id);

        $this->assertNotNull($store->logo);
        $this->assertStringStartsWith('stores/logos/', $store->logo);
        $this->assertStringStartsWith('/storage/stores/logos/', $configuration['logo']);
        Storage::disk('public')->assertExists($store->logo);
    }

    public function test_storefront_supports_slug_routes_and_custom_domain_routes(): void
    {
        [, $store] = $this->makeCompanyUserWithStore('domain-ready-store');

        $installedPath = storage_path('installed');
        $hadInstalledMarker = file_exists($installedPath);
        $installedContents = $hadInstalledMarker ? file_get_contents($installedPath) : null;

        file_put_contents($installedPath, 'installed');

        try {
            $store->update([
                'theme' => 'home-accessories',
                'is_active' => true,
                'enable_custom_domain' => true,
                'custom_domain' => 'shop.example.test',
            ]);

            $category = Category::create([
                'name' => 'Living Room',
                'slug' => 'living-room',
                'store_id' => $store->id,
                'is_active' => true,
            ]);

            Product::create([
                'name' => 'Coffee Table',
                'price' => 299.99,
                'stock' => 4,
                'category_id' => $category->id,
                'store_id' => $store->id,
                'is_active' => true,
            ]);

            $this->get(route('store.home', ['storeSlug' => $store->slug]))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('store/index')
                    ->where('store.slug', $store->slug)
                );

            $this->get('http://shop.example.test/')
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('store/index')
                    ->where('store.slug', $store->slug)
                );

            $this->get('http://shop.example.test/products')
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('store/products'));

            $this->get('http://shop.example.test/category/living-room')
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('store/category', false)
                    ->where('category.slug', 'living-room')
                );
        } finally {
            if ($hadInstalledMarker) {
                file_put_contents($installedPath, (string) $installedContents);
            } else {
                @unlink($installedPath);
            }
        }
    }

    public function test_unknown_host_root_does_not_resolve_a_random_store(): void
    {
        [, $store] = $this->makeCompanyUserWithStore('isolated-store');

        $installedPath = storage_path('installed');
        $hadInstalledMarker = file_exists($installedPath);
        $installedContents = $hadInstalledMarker ? file_get_contents($installedPath) : null;

        file_put_contents($installedPath, 'installed');

        try {
            $store->update([
                'enable_custom_domain' => true,
                'custom_domain' => 'known.example.test',
            ]);

            $this->get('http://unknown.example.test/')
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component('landing-page/index'));
        } finally {
            if ($hadInstalledMarker) {
                file_put_contents($installedPath, (string) $installedContents);
            } else {
                @unlink($installedPath);
            }
        }
    }

    private function makeCompanyUserWithStore(string $slug = 'tenant-store'): array
    {
        $plan = Plan::factory()->create([
            'is_default' => true,
            'is_plan_enable' => true,
            'price' => 0,
            'yearly_price' => 0,
            'max_stores' => 10,
            'max_users_per_store' => 10,
            'max_products_per_store' => 100,
            'enable_custdomain' => 'on',
            'enable_custsubdomain' => 'on',
            'themes' => ['home-accessories'],
        ]);

        $previous = User::$skipStoreCreation;
        User::$skipStoreCreation = true;

        try {
            $user = User::factory()->create([
                'type' => 'company',
                'plan_id' => $plan->id,
                'plan_is_active' => 1,
                'plan_expire_date' => null,
            ]);
        } finally {
            User::$skipStoreCreation = $previous;
        }

        $store = Store::factory()->create([
            'user_id' => $user->id,
            'slug' => $slug,
            'theme' => 'home-accessories',
            'is_active' => true,
        ]);

        $user->update(['current_store' => $store->id]);

        return [$user->fresh(), $store->fresh()];
    }

    private function grantPermissions(User $user, array $permissionNames): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $permissions = collect($permissionNames)->map(function (string $permissionName) {
            return Permission::firstOrCreate(
                ['name' => $permissionName, 'guard_name' => 'web'],
                [
                    'module' => 'Test',
                    'label' => str($permissionName)->replace('-', ' ')->title()->toString(),
                    'description' => $permissionName,
                ]
            );
        });

        $user->givePermissionTo($permissions);
    }
}
