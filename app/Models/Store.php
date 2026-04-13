<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'theme',
        'user_id',
        'custom_domain',
        'custom_subdomain',
        'enable_custom_domain',
        'enable_custom_subdomain',
        'email',
        'is_active',
        'name_ar',
        'name_en',
        'industry',
        'logo',
        'color',
        'pay_with_whatsapp',
        'whatsapp_number',
    ];
    
    protected $casts = [
        'enable_custom_domain' => 'boolean',
        'enable_custom_subdomain' => 'boolean',
        'is_active' => 'boolean',
        'pay_with_whatsapp' => 'boolean',
    ];

    /**
     * Get the user that owns the store.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the categories for the store.
     */
    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    /**
     * Get the products for the store.
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Get the blogs for the store.
     */
    public function blogs()
    {
        return $this->hasMany(Blog::class);
    }

    /**
     * Generate a unique slug for the store.
     */
    public static function generateUniqueSlug($name)
    {
        $slug = \Illuminate\Support\Str::slug($name);
        
        // Check if base slug exists
        $baseExists = static::where('slug', $slug)->exists();
        
        if (!$baseExists) {
            return $slug;
        }
        
        // Find the highest numbered variant
        $maxNumber = static::where('slug', 'like', $slug . '-%')
            ->get()
            ->map(function ($store) use ($slug) {
                if (preg_match('/^' . preg_quote($slug, '/') . '-(\d+)$/', $store->slug, $matches)) {
                    return (int) $matches[1];
                }
                return 0;
            })
            ->max();
        
        return $slug . '-' . ($maxNumber + 1);
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();
        
        static::created(function ($store) {
            // Create store-specific settings when a new store is created (only for non-seeding operations)
            if ($store->user && $store->user->type === 'company' && !app()->runningInConsole()) {
                copySettingsFromSuperAdmin($store->user_id, $store->id);
            }
        });
    }
}