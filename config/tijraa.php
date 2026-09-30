<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI provider
    |--------------------------------------------------------------------------
    | auto      — Anthropic if ANTHROPIC_API_KEY is set, else OpenAI if a key is
    |             configured (env OPENAI_API_KEY or Settings → ChatGPT), else none.
    | openai | anthropic — force one provider.
    | scripted  — deterministic test model. Refused in production; always
    |             labelled in the UI. Used by E2E tests and local demos.
    */
    'ai' => [
        'provider' => env('TIJRAA_AI_PROVIDER', 'auto'),
        'allow_scripted' => (bool) env('TIJRAA_ALLOW_SCRIPTED_MODEL', false),
        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            'model' => env('OPENAI_MODEL'),
            'embedding_model' => env('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
        ],
        'anthropic' => [
            'api_key' => env('ANTHROPIC_API_KEY'),
            'model' => env('ANTHROPIC_MODEL', 'claude-sonnet-5-5'),
            'base_url' => env('ANTHROPIC_BASE_URL', 'https://api.anthropic.com'),
        ],
        'request_timeout' => (int) env('TIJRAA_AI_TIMEOUT', 60),

        // USD per 1M tokens [input, output] for the usage ledger (estimates).
        'pricing' => [
            'default' => [1.0, 4.0],
            'gpt-4o-mini' => [0.15, 0.6],
            'gpt-4o' => [2.5, 10.0],
            'gpt-4.1-mini' => [0.4, 1.6],
            'claude-sonnet-5-5' => [3.0, 15.0],
            'claude-haiku-4-5-20251001' => [1.0, 5.0],
            'scripted' => [0.0, 0.0],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Agent runtime limits
    |--------------------------------------------------------------------------
    */
    'agent' => [
        'prompt_version' => 'copilot-2026.09.1',
        'max_steps' => (int) env('TIJRAA_AGENT_MAX_STEPS', 8),
        'max_tool_calls' => (int) env('TIJRAA_AGENT_MAX_TOOL_CALLS', 16),
        'max_run_tokens' => (int) env('TIJRAA_AGENT_MAX_RUN_TOKENS', 120000),
        'run_time_budget_seconds' => (int) env('TIJRAA_AGENT_TIME_BUDGET', 120),
        'tool_timeout_seconds' => 10,
        'lease_seconds' => 90,
        'history_messages' => 40,
    ],

    'actions' => [
        'expires_after_hours' => (int) env('TIJRAA_ACTION_TTL_HOURS', 72),
    ],

    /*
    |--------------------------------------------------------------------------
    | Budgets
    |--------------------------------------------------------------------------
    | Monthly tokens per store. A plan's `ai_monthly_tokens` overrides the
    | default; a store setting `ai_monthly_token_budget` overrides both.
    | Per-feature share caps any single feature at a fraction of the budget.
    */
    'budget' => [
        'default_monthly_tokens' => (int) env('TIJRAA_AI_MONTHLY_TOKENS', 2_000_000),
        'feature_share' => [
            'copilot' => 1.0,
            'content_studio' => 0.6,
            'content_editor' => 0.6,
            'knowledge' => 0.4,
        ],
    ],

    'knowledge' => [
        'max_upload_kb' => 5120,
        'allowed_extensions' => ['txt', 'md', 'markdown', 'csv', 'html', 'htm', 'json', 'docx', 'pdf'],
        'chunk_chars' => 900,
        'chunk_overlap' => 150,
        'embedding_dims' => 512, // local hashed embeddings
        'search_limit' => 5,
        'min_score' => 0.08,
    ],

    'notifications' => [
        'low_stock_dedupe_hours' => 24,
    ],
];
