<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserLanguageController extends Controller
{
    public function update(Request $request)
    {
        $request->validate([
            'language' => 'required|string|max:5'
        ]);

        $language = $request->language;
        
        // Validate language against supported languages
        $languageDataPath = resource_path('lang/language.json');
        if (file_exists($languageDataPath)) {
            $languages = json_decode(file_get_contents($languageDataPath), true);
            $supportedCodes = array_column($languages, 'code');
            if (!in_array($language, $supportedCodes)) {
                $language = 'ar'; // Fallback to Arabic if invalid
            }
        }

        $user = Auth::user();
        if ($user) {
            // In demo mode, store language in session instead of database
            if (config('app.is_demo', false)) {
                session(['demo_language' => $language]);
                return back()->cookie('lang', $language, 60 * 24 * 365); // 1 year
            }
            
            // Normal mode: update database
            $user->update(['lang' => $language]);
            return back()->cookie('lang', $language, 60 * 24 * 365); // Also set cookie for consistency
        }

        // For guests, set cookie only
        return back()->cookie('lang', $language, 60 * 24 * 365); // 1 year
    }
}