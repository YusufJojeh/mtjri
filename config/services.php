<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides a sane default
    | location for this type of information, however, you may store credentials
    | all over your application, as long as your are aware of the risks.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'unsplash' => [
        'retries' => (int) env('UNSPLASH_RETRIES', 2),
        'retry_sleep_ms' => (int) env('UNSPLASH_RETRY_SLEEP_MS', 1000),
        'timeout' => (int) env('UNSPLASH_TIMEOUT', 5),

        // Prefer a dedicated app name for Unsplash UTM (avoid spaces/special chars).
        'app_name' => env('UNSPLASH_APP_NAME', env('APP_NAME', 'matjri')),

        // Optional: TTL (seconds) to avoid sending duplicate download triggers.
        'download_track_cache_ttl' => (int) env('UNSPLASH_DOWNLOAD_TRACK_TTL', 86400),
    ],

];
