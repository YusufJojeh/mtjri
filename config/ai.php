<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default AI Provider
    |--------------------------------------------------------------------------
    |
    | Stored setting `aiProviderDefault` overrides this value when present.
    |
    */
    'default_provider' => env('AI_PROVIDER_DEFAULT', 'openai'),

    /*
    |--------------------------------------------------------------------------
    | Agentic Controls
    |--------------------------------------------------------------------------
    |
    | Stored setting `aiAgenticEnabled` overrides this value when present.
    |
    */
    'agentic_enabled' => env('AI_AGENTIC_ENABLED', false),
    'max_steps' => (int) env('AI_AGENTIC_MAX_STEPS', 4),
    'max_content_chars' => (int) env('AI_MAX_CONTENT_CHARS', 12000),
    'fallback_to_openai' => env('AI_FALLBACK_TO_OPENAI', false),

    /*
    |--------------------------------------------------------------------------
    | Ollama Runtime Defaults
    |--------------------------------------------------------------------------
    |
    | Stored settings override these values when present.
    |
    */
    'ollama' => [
        'base_url' => env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
        'model' => env('OLLAMA_MODEL', ''),
        'timeout_ms' => (int) env('OLLAMA_TIMEOUT_MS', 60000),
    ],
];

