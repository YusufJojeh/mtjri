<?php

namespace App\Http\Middleware;

use App\Models\Currency;
use App\Models\ReferralSetting;
use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Cache supported locale codes to avoid reading language.json on every request.
     */
    private static ?array $cachedSupportedLocales = null;

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Shared props for Inertia.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // ---- Safety flags (no DB queries during install/update/uninstalled)
        $installed = $this->isInstalled();
        $isSetupRoute = $this->isSetupRoute($request);
        $skipDb = $isSetupRoute || !$installed;

        // ---- Locale: set it early for all requests (guests + auth)
        // AR: يثبت اللغة لكل الطلبات بدون كسر أثناء التنصيب
        $locale = $this->resolveLocale($request, $skipDb);
        app()->setLocale($locale);

        // ---- Quote: safe parsing (prevents trim(null) TypeError on PHP 8+)
        [$quoteMessage, $quoteAuthor] = $this->safeQuote();

        // ---- Global settings + currency (safe defaults)
        $globalSettings = $this->defaultGlobalSettings();
        $storeCurrency  = $this->defaultCurrencySettings();

        if (!$skipDb) {
            // settings() must be array-safe
            // EN: settings() might return collection/object/null in some projects
            $settings = (array) settings();

            // Currency settings (global)
            $currencyCode = $settings['defaultCurrency'] ?? 'USD';
            $currency = Currency::where('code', $currencyCode)->first();

            $currencySettings = $currency
                ? [
                    'currencySymbol' => $currency->symbol,
                    'currencyName'   => $currency->name,
                    // backward compatibility for existing frontend code (typo used earlier)
                    'currencyNname'  => $currency->name,
                ]
                : [
                    'currencySymbol' => '$',
                    'currencyName'   => 'US Dollar',
                    'currencyNname'  => 'US Dollar',
                ];

            // Merge settings into globalSettings
            $globalSettings = array_merge($settings, $currencySettings);
            $globalSettings['base_url']  = config('app.url');
            $globalSettings['image_url'] = config('app.url');

            // Filter sensitive keys before sharing to frontend
            $globalSettings = $this->filterSensitiveSettings($globalSettings);

            // Flags (computed from original $settings, not filtered)
            $globalSettings['hasUnsplashAccessKey']       = !empty($settings['unsplashAccessKey'] ?? null);
            $globalSettings['hasUnsplashApplicationId']   = !empty($settings['unsplashApplicationId'] ?? null);
            $globalSettings['hasUnsplashSecretKey']       = !empty($settings['unsplashSecretKey'] ?? null);

            // Store currency (company-aware)
            $storeCurrency = $this->getStoreCurrencySettings($request);
        }

        // ---- Auth props as lazy closure (Inertia best practice)
        $authProps = function () use ($request, $locale, $skipDb) {
            $user = $request->user();

            if (!$user) {
                return [
                    'user'          => null,
                    'roles'         => [],
                    'permissions'   => [],
                    'enabledAddons' => [],
                    'lang'          => $locale,
                    'stores'        => [],
                ];
            }

            // Load relations safely
            // EN: avoid creator null errors + avoid N+1
            $user->loadMissing(['stores', 'plan', 'roles', 'permissions', 'creator.plan', 'creator.stores']);

            // Resolve stores based on user type
            $stores = $this->resolveStoresForUser($user);

            // Demo mode: override current_store from cookie if valid
            $this->applyDemoStoreCookie($request, $user, $stores);

            // If the user is a sub-user, inherit plan from creator if available
            if (!in_array($user->type, ['company', 'superadmin'], true)) {
                $user->plan = $user->creator?->plan;
            }

            // Enabled addons placeholder (keep as you had)
            $enabledAddons = [];

            // In demo mode language can be session-based
            $resolvedLang = $locale;
            if (config('app.is_demo', false) && session('demo_language')) {
                $resolvedLang = (string) session('demo_language');
            } elseif ($user->lang) {
                $resolvedLang = $user->lang;
            } elseif (!$skipDb) {
                $resolvedLang = $this->getSuperAdminLangCached();
            }

            return [
                'user'          => $user,
                'roles'         => $user->roles?->pluck('name') ?? [],
                'permissions'   => method_exists($user, 'getAllPermissions')
                    ? $user->getAllPermissions()->pluck('name')
                    : [],
                'enabledAddons' => $enabledAddons,
                'lang'          => $resolvedLang,
                'stores'        => $stores,
            ];
        };

        // ---- Stores top-level prop (keep for backward compatibility)
        // AR: إذا الواجهة بتستخدم props.stores مباشرة، منتركها
        $storesTopLevel = function () use ($request) {
            $user = $request->user();
            if (!$user) return [];

            $user->loadMissing(['stores', 'creator.stores']);
            $stores = $this->resolveStoresForUser($user);

            $this->applyDemoStoreCookie($request, $user, $stores);

            return $stores;
        };

        // ---- superadmin settings / referral / title text (skip DB while setup)
        $superadminSettings = $skipDb
            ? defaultSettings()
            : array_merge(defaultSettings(), getSuperadminSettings());

        $dynamicTitleText = $skipDb
            ? config('app.name', 'Tijraa')
            : getSetting('titleText', config('app.name', 'Tijraa'));

        $referralEnabled = $skipDb ? false : ReferralSetting::isEnabled();

        return [
            ...parent::share($request),

            'name'       => config('app.name'),
            'appName'    => config('app.name'),
            'base_url'   => config('app.url'),
            'image_url'  => config('app.url'),

            'quote'      => [
                'message' => $quoteMessage,
                'author'  => $quoteAuthor,
            ],

            'csrf_token' => csrf_token(),
            'locale'     => $locale,

            'auth'       => $authProps,

            'isImpersonating' => (bool) session('impersonated_by'),

            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],

            'flash' => [
                'success' => $request->session()->get('success'),
                'error'   => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info'    => $request->session()->get('info'),
            ],

            'globalSettings'      => $globalSettings,
            'superadminSettings'  => $superadminSettings,
            'storeCurrency'       => $storeCurrency,
            'dynamicTitleText'    => $dynamicTitleText,

            'referralSettings' => [
                'is_enabled' => $referralEnabled,
            ],

            // Tijraa platform indicators (bell, Action Center badge, AI availability)
            'tijraa' => fn () => $skipDb ? null : $this->tijraaProps($request),

            'is_demo' => config('app.is_demo', false),

            // backward compatibility
            'stores' => $storesTopLevel,
        ];
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private function isInstalled(): bool
    {
        return file_exists(storage_path('installed'));
    }

    private function isSetupRoute(Request $request): bool
    {
        return $request->is('install/*') || $request->is('update/*');
    }

    /**
     * Safe quote parsing to prevent trim(null) errors.
     */
    private function safeQuote(): array
    {
        $raw = (string) Inspiring::quotes()->random();
        $parts = array_map('trim', explode('-', $raw, 2));

        $message = $parts[0] ?? '';
        $author  = $parts[1] ?? '';

        return [$message, $author];
    }

    private function defaultGlobalSettings(): array
    {
        return [
            'currencySymbol' => '$',
            'currencyName'   => 'US Dollar',
            'currencyNname'  => 'US Dollar', // backward compat
            'base_url'       => config('app.url'),
            'image_url'      => config('app.url'),
        ];
    }

    private function defaultCurrencySettings(): array
    {
        return [
            'code'                => 'USD',
            'symbol'              => '$',
            'name'                => 'US Dollar',
            'position'            => 'before',
            'decimals'            => 2,
            'decimal_separator'   => '.',
            'thousands_separator' => ',',
        ];
    }

    /**
     * Filter out sensitive configuration keys that should not be shared with frontend.
     */
    private function filterSensitiveSettings(array $settings): array
    {
        // EN: ensure always array, config may return null
        $sensitiveKeys = (array) config('sensitive-keys', []);

        // Add Unsplash keys (do NOT leak)
        $sensitiveKeys[] = 'unsplashAccessKey';
        $sensitiveKeys[] = 'unsplashApplicationId';
        $sensitiveKeys[] = 'unsplashSecretKey';

        return array_diff_key($settings, array_flip($sensitiveKeys));
    }

    /**
     * Resolve locale safely for guests/auth/demo.
     * AR: لو أثناء التنصيب ما منعمل أي query.
     */
    private function resolveLocale(Request $request, bool $skipDb): string
    {
        $default = 'ar';
        $user = $request->user();

        // Demo mode language override
        if (config('app.is_demo', false) && session('demo_language')) {
            $locale = (string) session('demo_language');
            return $this->validateLocale($locale, $default);
        }

        if ($user) {
            $locale = $user->lang ?: ($skipDb ? $default : $this->getSuperAdminLangCached());
            return $this->validateLocale($locale, $default);
        }

        // Guest: cookie or default
        $locale = (string) ($request->cookie('lang') ?? $default);
        return $this->validateLocale($locale, $default);
    }

    /**
     * Validate locale against supported languages file.
     */
    private function validateLocale(string $locale, string $fallback): string
    {
        $supported = $this->getSupportedLocaleCodes();
        if (!$supported) return $fallback;

        return in_array($locale, $supported, true) ? $locale : $fallback;
    }

    /**
     * Load supported locale codes from resource/lang/language.json with caching.
     */
    private function getSupportedLocaleCodes(): array
    {
        if (self::$cachedSupportedLocales !== null) {
            return self::$cachedSupportedLocales;
        }

        $path = resource_path('lang/language.json');
        if (!file_exists($path)) {
            self::$cachedSupportedLocales = [];
            return self::$cachedSupportedLocales;
        }

        $json = json_decode((string) file_get_contents($path), true);
        if (!is_array($json)) {
            self::$cachedSupportedLocales = [];
            return self::$cachedSupportedLocales;
        }

        $codes = array_values(array_filter(array_map(
            fn ($row) => is_array($row) ? ($row['code'] ?? null) : null,
            $json
        )));

        self::$cachedSupportedLocales = $codes;
        return self::$cachedSupportedLocales;
    }

    /**
     * Cached superadmin lang to avoid repeated DB query.
     */
    private function getSuperAdminLangCached(): string
    {
        static $cached = null;
        if ($cached !== null) return $cached;

        // Default Arabic
        $cached = 'ar';

        $superAdmin = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['superadmin', 'super admin']);
        })->first();

        if ($superAdmin && $superAdmin->lang) {
            $cached = $superAdmin->lang;
        }

        return $cached;
    }

    /**
     * Resolve stores for a user based on type.
     */
    private function resolveStoresForUser(User $user): array
    {
        if ($user->type === 'company') {
            return $user->stores ? $user->stores->values()->all() : [];
        }

        if ($user->type === 'user' && $user->created_by) {
            return $user->creator?->stores ? $user->creator->stores->values()->all() : [];
        }

        return $user->stores ? $user->stores->values()->all() : [];
    }

    /**
     * Demo mode: override current_store based on cookie if store belongs to user/creator.
     */
    private function applyDemoStoreCookie(Request $request, User $user, array $stores): void
    {
        if (!config('app.is_demo')) return;

        $cookie = $request->cookie('demo_store_id');
        if (!$cookie) return;

        $storeId = (int) $cookie;
        $exists = collect($stores)->contains('id', $storeId);

        if ($exists) {
            $user->current_store = $storeId;
        }
    }

    /**
     * Get currency settings from company settings for the current user.
     */
    private function getStoreCurrencySettings(Request $request): array
    {
        $user = $request->user();
        $default = $this->defaultCurrencySettings();

        if (!$user) return $default;

        try {
            // Ensure relations for creator
            $user->loadMissing(['creator']);

            // Company context:
            // - company user => itself
            // - sub-user => creator (company owner)
            $companyUser = ($user->type === 'user' && $user->created_by)
                ? $user->creator
                : $user;

            if (!$companyUser) return $default;

            $companySettings = (array) settings($companyUser->id);

            $currencyCode = $companySettings['defaultCurrency'] ?? 'USD';
            $currency = Currency::where('code', $currencyCode)->first();

            if (!$currency) return $default;

            return [
                'code'                => $currency->code,
                'symbol'              => $currency->symbol,
                'name'                => $currency->name,
                'position'            => $companySettings['currencySymbolPosition'] ?? 'before',
                'decimals'            => (int) ($companySettings['decimalFormat'] ?? 2),
                'decimal_separator'   => $companySettings['decimalSeparator'] ?? '.',
                'thousands_separator' => $companySettings['thousandsSeparator'] ?? ',',
            ];
        } catch (\Throwable $e) {
            return $default;
        }
    }

    private function tijraaProps(Request $request): ?array
    {
        $user = $request->user();
        if (! $user || $user->type === 'superadmin') {
            return null;
        }
        try {
            $storeId = getCurrentStoreId($user);
            if (! $storeId) {
                return null;
            }

            return [
                'unread_notifications' => $user->can('view-notifications')
                    ? \App\Models\Ai\MerchantNotification::where('user_id', $user->id)->where('store_id', $storeId)->whereNull('read_at')->count() : 0,
                'pending_actions' => $user->can('view-ai-actions')
                    ? \App\Models\Ai\AgentAction::where('store_id', $storeId)->where('status', 'pending')->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))->count() : 0,
                'ai' => app(\App\Ai\AiManager::class)->describe(),
            ];
        } catch (\Throwable $e) {
            report($e);

            return null;
        }
    }
}
