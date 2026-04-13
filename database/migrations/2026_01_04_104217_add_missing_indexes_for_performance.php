<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Check if an index exists on a table column
     */
    private function hasIndex(string $table, string $column): bool
    {
        try {
            $indexes = DB::select("SHOW INDEXES FROM `{$table}` WHERE Column_name = ?", [$column]);
            return !empty($indexes);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Users table
        if (!$this->hasIndex('users', 'email')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index('email');
            });
        }

        // Stores table
        if (!$this->hasIndex('stores', 'user_id')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->index('user_id');
            });
        }
        if (!$this->hasIndex('stores', 'slug')) {
            Schema::table('stores', function (Blueprint $table) {
                $table->index('slug');
            });
        }

        // Customers table
        if (!$this->hasIndex('customers', 'store_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->index('store_id');
            });
        }
        if (!$this->hasIndex('customers', 'email')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->index('email');
            });
        }

        // Products table
        if (!$this->hasIndex('products', 'store_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index('store_id');
            });
        }
        if (!$this->hasIndex('products', 'category_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index('category_id');
            });
        }
        if (!$this->hasIndex('products', 'tax_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->index('tax_id');
            });
        }

        // Categories table
        if (!$this->hasIndex('categories', 'store_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->index('store_id');
            });
        }
        if (!$this->hasIndex('categories', 'parent_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->index('parent_id');
            });
        }

        // Orders table
        if (!$this->hasIndex('orders', 'store_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index('store_id');
            });
        }
        if (!$this->hasIndex('orders', 'customer_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index('customer_id');
            });
        }
        if (!$this->hasIndex('orders', 'status')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index('status');
            });
        }
        if (!$this->hasIndex('orders', 'payment_status')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->index('payment_status');
            });
        }

        // Order items table
        if (!$this->hasIndex('order_items', 'order_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->index('order_id');
            });
        }
        if (!$this->hasIndex('order_items', 'product_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->index('product_id');
            });
        }

        // Product reviews table
        if (!$this->hasIndex('product_reviews', 'product_id')) {
            Schema::table('product_reviews', function (Blueprint $table) {
                $table->index('product_id');
            });
        }
        if (!$this->hasIndex('product_reviews', 'customer_id')) {
            Schema::table('product_reviews', function (Blueprint $table) {
                $table->index('customer_id');
            });
        }
        if (!$this->hasIndex('product_reviews', 'store_id')) {
            Schema::table('product_reviews', function (Blueprint $table) {
                $table->index('store_id');
            });
        }

        // Newsletter subscriptions table
        if (!$this->hasIndex('newsletter_subscriptions', 'store_id')) {
            Schema::table('newsletter_subscriptions', function (Blueprint $table) {
                $table->index('store_id');
            });
        }
        if (!$this->hasIndex('newsletter_subscriptions', 'email')) {
            Schema::table('newsletter_subscriptions', function (Blueprint $table) {
                $table->index('email');
            });
        }

        // Shippings table
        if (!$this->hasIndex('shippings', 'store_id')) {
            Schema::table('shippings', function (Blueprint $table) {
                $table->index('store_id');
            });
        }

        // Taxes table
        if (!$this->hasIndex('taxes', 'store_id')) {
            Schema::table('taxes', function (Blueprint $table) {
                $table->index('store_id');
            });
        }

        // Coupons table
        if (!$this->hasIndex('coupons', 'code')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->index('code');
            });
        }
        if (!$this->hasIndex('coupons', 'created_by')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->index('created_by');
            });
        }

        // Blog categories table
        if (!$this->hasIndex('blog_categories', 'store_id')) {
            Schema::table('blog_categories', function (Blueprint $table) {
                $table->index('store_id');
            });
        }

        // Blogs table
        if (!$this->hasIndex('blogs', 'store_id')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->index('store_id');
            });
        }
        if (!$this->hasIndex('blogs', 'category_id')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->index('category_id');
            });
        }
        if (!$this->hasIndex('blogs', 'author_id')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->index('author_id');
            });
        }
        if (!$this->hasIndex('blogs', 'slug')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->index('slug');
            });
        }

        // Blog tags table
        if (!$this->hasIndex('blog_tags', 'store_id')) {
            Schema::table('blog_tags', function (Blueprint $table) {
                $table->index('store_id');
            });
        }

        // Blog comments table
        if (!$this->hasIndex('blog_comments', 'blog_id')) {
            Schema::table('blog_comments', function (Blueprint $table) {
                $table->index('blog_id');
            });
        }
        if (!$this->hasIndex('blog_comments', 'user_id')) {
            Schema::table('blog_comments', function (Blueprint $table) {
                $table->index('user_id');
            });
        }

        // Custom pages table
        if (!$this->hasIndex('custom_pages', 'store_id')) {
            Schema::table('custom_pages', function (Blueprint $table) {
                $table->index('store_id');
            });
        }
        if (!$this->hasIndex('custom_pages', 'slug')) {
            Schema::table('custom_pages', function (Blueprint $table) {
                $table->index('slug');
            });
        }

        // Express checkouts table
        if (!$this->hasIndex('express_checkouts', 'store_id')) {
            Schema::table('express_checkouts', function (Blueprint $table) {
                $table->index('store_id');
            });
        }

        // Cart items table
        if (!$this->hasIndex('cart_items', 'store_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->index('store_id');
            });
        }
        if (!$this->hasIndex('cart_items', 'product_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->index('product_id');
            });
        }
        if (!$this->hasIndex('cart_items', 'customer_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->index('customer_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only drop indexes that were created by this migration
        // Check each index before dropping to avoid errors

        if ($this->hasIndex('users', 'email')) {
            // Only drop if it's the non-unique index (users_email_index)
            try {
                $indexes = DB::select("SHOW INDEXES FROM users WHERE Key_name = 'users_email_index'");
                if (!empty($indexes)) {
                    Schema::table('users', function (Blueprint $table) {
                        $table->dropIndex(['email']);
                    });
                }
            } catch (\Exception $e) {
                // Ignore if drop fails
            }
        }

        if ($this->hasIndex('stores', 'user_id')) {
            try {
                $indexes = DB::select("SHOW INDEXES FROM stores WHERE Key_name = 'stores_user_id_index'");
                if (!empty($indexes)) {
                    Schema::table('stores', function (Blueprint $table) {
                        $table->dropIndex(['user_id']);
                    });
                }
            } catch (\Exception $e) {
                // Ignore if drop fails
            }
        }
        if ($this->hasIndex('stores', 'slug')) {
            try {
                $indexes = DB::select("SHOW INDEXES FROM stores WHERE Key_name = 'stores_slug_index'");
                if (!empty($indexes)) {
                    Schema::table('stores', function (Blueprint $table) {
                        $table->dropIndex(['slug']);
                    });
                }
            } catch (\Exception $e) {
                // Ignore if drop fails
            }
        }

        if ($this->hasIndex('customers', 'store_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }
        if ($this->hasIndex('customers', 'email')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->dropIndex(['email']);
            });
        }

        if ($this->hasIndex('products', 'store_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }
        if ($this->hasIndex('products', 'category_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropIndex(['category_id']);
            });
        }
        if ($this->hasIndex('products', 'tax_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropIndex(['tax_id']);
            });
        }

        if ($this->hasIndex('categories', 'store_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }
        if ($this->hasIndex('categories', 'parent_id')) {
            Schema::table('categories', function (Blueprint $table) {
                $table->dropIndex(['parent_id']);
            });
        }

        if ($this->hasIndex('orders', 'store_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }
        if ($this->hasIndex('orders', 'customer_id')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex(['customer_id']);
            });
        }
        if ($this->hasIndex('orders', 'status')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex(['status']);
            });
        }
        if ($this->hasIndex('orders', 'payment_status')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex(['payment_status']);
            });
        }

        if ($this->hasIndex('order_items', 'order_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropIndex(['order_id']);
            });
        }
        if ($this->hasIndex('order_items', 'product_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropIndex(['product_id']);
            });
        }

        if ($this->hasIndex('product_reviews', 'product_id')) {
            Schema::table('product_reviews', function (Blueprint $table) {
                $table->dropIndex(['product_id']);
            });
        }
        if ($this->hasIndex('product_reviews', 'customer_id')) {
            Schema::table('product_reviews', function (Blueprint $table) {
                $table->dropIndex(['customer_id']);
            });
        }
        if ($this->hasIndex('product_reviews', 'store_id')) {
            Schema::table('product_reviews', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }

        if ($this->hasIndex('newsletter_subscriptions', 'store_id')) {
            Schema::table('newsletter_subscriptions', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }
        if ($this->hasIndex('newsletter_subscriptions', 'email')) {
            Schema::table('newsletter_subscriptions', function (Blueprint $table) {
                $table->dropIndex(['email']);
            });
        }

        if ($this->hasIndex('shippings', 'store_id')) {
            Schema::table('shippings', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }

        if ($this->hasIndex('taxes', 'store_id')) {
            Schema::table('taxes', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }

        if ($this->hasIndex('coupons', 'code')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->dropIndex(['code']);
            });
        }
        if ($this->hasIndex('coupons', 'created_by')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->dropIndex(['created_by']);
            });
        }

        if ($this->hasIndex('blog_categories', 'store_id')) {
            Schema::table('blog_categories', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }

        if ($this->hasIndex('blogs', 'store_id')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }
        if ($this->hasIndex('blogs', 'category_id')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->dropIndex(['category_id']);
            });
        }
        if ($this->hasIndex('blogs', 'author_id')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->dropIndex(['author_id']);
            });
        }
        if ($this->hasIndex('blogs', 'slug')) {
            Schema::table('blogs', function (Blueprint $table) {
                $table->dropIndex(['slug']);
            });
        }

        if ($this->hasIndex('blog_tags', 'store_id')) {
            Schema::table('blog_tags', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }

        if ($this->hasIndex('blog_comments', 'blog_id')) {
            Schema::table('blog_comments', function (Blueprint $table) {
                $table->dropIndex(['blog_id']);
            });
        }
        if ($this->hasIndex('blog_comments', 'user_id')) {
            Schema::table('blog_comments', function (Blueprint $table) {
                $table->dropIndex(['user_id']);
            });
        }

        if ($this->hasIndex('custom_pages', 'store_id')) {
            Schema::table('custom_pages', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }
        if ($this->hasIndex('custom_pages', 'slug')) {
            Schema::table('custom_pages', function (Blueprint $table) {
                $table->dropIndex(['slug']);
            });
        }

        if ($this->hasIndex('express_checkouts', 'store_id')) {
            Schema::table('express_checkouts', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }

        if ($this->hasIndex('cart_items', 'store_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropIndex(['store_id']);
            });
        }
        if ($this->hasIndex('cart_items', 'product_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropIndex(['product_id']);
            });
        }
        if ($this->hasIndex('cart_items', 'customer_id')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropIndex(['customer_id']);
            });
        }
    }
};
