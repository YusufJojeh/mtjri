<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Cache;

/**
 * Translation Controller
 * 
 * This controller serves STATIC JSON translation files only.
 * It does NOT use Laravel's translation system.
 * 
 * All translations are stored in resources/lang/{locale}.json files
 * and are served directly to the frontend i18next library.
 * 
 * The frontend uses react-i18next with static JSON files only.
 */
class TranslationController extends BaseController
{
    /**
     * Get static translation file for the given locale
     * 
     * This simply returns the JSON file content - no Laravel translation processing.
     * 
     * @param string $locale Language code (e.g., 'en', 'ar', 'de', 'fr')
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTranslations($locale)
    {
        // Normalize locale (handle cases like 'de-DE' -> 'de', 'pt-BR' -> 'pt-BR')
        // Keep hyphenated codes like 'pt-BR', 'zh-CN', 'zh-TW' as-is
        $normalizedLocale = $locale;
        if (strpos($locale, '-') !== false) {
            // Check if the full locale exists (e.g., 'pt-BR.json')
            $fullPath = resource_path("lang/{$locale}.json");
            if (!File::exists($fullPath)) {
                // If full locale doesn't exist, try base language (e.g., 'pt' for 'pt-BR')
                $normalizedLocale = explode('-', $locale)[0];
            }
        }
        
        $path = resource_path("lang/{$normalizedLocale}.json");
        $isFallback = false;
        
        if (!File::exists($path)) {
            // Fallback to Arabic as the global default
            $path = resource_path("lang/ar.json");
            $isFallback = true;
            $normalizedLocale = 'ar';
        }
        
        // Validate JSON file
        $fileContents = File::get($path);
        $translations = json_decode($fileContents, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // If JSON is invalid, fallback to Arabic
            $path = resource_path("lang/ar.json");
            $translations = json_decode(File::get($path), true);
            $isFallback = true;
            $normalizedLocale = 'ar';
        }
        
        $response = response()->json($translations)
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0')
            ->header('Content-Type', 'application/json; charset=utf-8');
        
        // Indicate if fallback was used
        if ($isFallback) {
            $response->header('X-Fallback-Locale', 'ar');
        } else {
            $response->header('X-Locale', $normalizedLocale);
        }
        
        return $response;
    }
} 