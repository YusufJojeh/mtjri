<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use App\Models\Setting;

class UnsplashController extends Controller
{
    /**
     * Trigger a download for an Unsplash photo.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function triggerDownload(Request $request)
    {
        $request->validate([
            'download_location' => 'required|url',
            'unsplash_id' => 'required|string',
        ]);

        $downloadLocation = $request->input('download_location');
        $unsplashId = $request->input('unsplash_id');
        $accessKey = Setting::getGlobal('unsplashAccessKey');

        if (!$accessKey) {
            Log::error('Unsplash API access key not set in settings for download trigger.');
            return response()->json(['message' => 'Unsplash API access key not configured.'], 500);
        }

        // إضافة caching لتجنب duplicate requests في فترة قصيرة
        $cacheKey = 'unsplash_download_' . $unsplashId . '_' . md5($request->ip());
        if (Cache::has($cacheKey)) {
            Log::info('Unsplash download already triggered for photo: ' . $unsplashId . ' from IP: ' . $request->ip());
            return response()->json(['message' => 'Download already triggered recently.'], 200);
        }

        try {
            // إرسال الطلب إلى download endpoint
            $response = Http::get($downloadLocation, [
                'client_id' => $accessKey,
            ]);

            if ($response->successful()) {
                // تخزين في الـcache لمنع requests مكررة
                Cache::put($cacheKey, true, now()->addMinutes(30)); // cache لمدة 30 دقيقة
                Log::info('Unsplash download triggered successfully for photo: ' . $unsplashId . '. Response: ' . $response->body());
                return response()->json(['message' => 'Download triggered successfully.'], 200);
            } else {
                Log::error('Unsplash download trigger failed for photo: ' . $unsplashId . '. Status: ' . $response->status() . ' Body: ' . $response->body());
                return response()->json(['message' => 'Failed to trigger download.', 'status' => $response->status()], $response->status());
            }
        } catch (\Exception $e) {
            Log::error('Unsplash download trigger exception for photo: ' . $unsplashId . '. Error: ' . $e->getMessage());
            return response()->json(['message' => 'An error occurred while triggering download.'], 500);
        }
    }
}

