<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Currency;
use App\Models\PaymentSetting;
use App\Models\Webhook;

class SettingsController extends Controller
{
    /**
     * Display the main settings page.
     *
     * @return \Inertia\Response
     */
    public function index()
    {
        $user = auth()->user();
        $storeId = $user->type === 'company' ? getCurrentStoreId($user) : null;
        
        // Get system settings - store-specific for company users
        if ($storeId) {
            // For company users, get store-specific settings with fallback to global
            $systemSettings = Setting::getUserSettings($user->id, $storeId);
            
            // If no store-specific settings exist, fall back to global settings
            if (empty($systemSettings)) {
                $globalSettings = settings();
                $systemSettings = $globalSettings;
            } else {
                // Merge with global settings for missing keys
                $globalSettings = settings();
                $systemSettings = array_merge($globalSettings, $systemSettings);
            }
        } else {
            // For superadmin/admin, use global settings
            $systemSettings = settings();
        }

        // Include global AI settings
        $systemSettings['chatgptKey'] = Setting::getGlobal('chatgptKey');
        $systemSettings['chatgptModel'] = Setting::getGlobal('chatgptModel') ?? 'gpt-3.5-turbo';
        $systemSettings['unsplashAccessKey'] = Setting::getGlobal('unsplashAccessKey');
        $systemSettings['unsplashApplicationId'] = Setting::getGlobal('unsplashApplicationId');
        $systemSettings['unsplashSecretKey'] = Setting::getGlobal('unsplashSecretKey');
        
        $currencies = Currency::all();
        $paymentSettings = PaymentSetting::getUserSettings($user->id, $storeId);
        $webhooks = Webhook::where('user_id', $user->id)->get();
        
        return Inertia::render('settings/index', [
            'systemSettings' => $systemSettings,
            'settings' => $systemSettings, // For helper functions
            'cacheSize' => getCacheSize(),
            'currencies' => $currencies,
            'timezones' => config('timezones'),
            'dateFormats' => config('dateformat'),
            'timeFormats' => config('timeformat'),
            'paymentSettings' => $paymentSettings,
            'webhooks' => $webhooks,
            'hasChatgptKey' => !empty(Setting::getGlobal('chatgptKey')),
            'hasUnsplashKey' => !empty(Setting::getGlobal('unsplashAccessKey')),
            'hasUnsplashApplicationId' => !empty(Setting::getGlobal('unsplashApplicationId')),
            'hasUnsplashSecretKey' => !empty(Setting::getGlobal('unsplashSecretKey')),

        ]);
    }
}