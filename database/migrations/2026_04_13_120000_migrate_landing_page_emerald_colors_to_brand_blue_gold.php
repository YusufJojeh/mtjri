<?php

use App\Models\LandingPageSetting;
use Illuminate\Database\Migrations\Migration;

/**
 * Legacy landing defaults used emerald (#10b981). Public marketing brand is digital blue + gold.
 */
return new class extends Migration
{
    public function up(): void
    {
        foreach (LandingPageSetting::query()->cursor() as $row) {
            $config = $row->config_sections;
            if (! is_array($config) || ! isset($config['colors']) || ! is_array($config['colors'])) {
                continue;
            }

            $colors = $config['colors'];
            $primary = strtolower((string) ($colors['primary'] ?? ''));
            $secondary = strtolower((string) ($colors['secondary'] ?? ''));
            $accent = strtolower((string) ($colors['accent'] ?? ''));

            $changed = false;

            if ($primary === '#10b981') {
                $colors['primary'] = '#1E90FF';
                $changed = true;
            }
            if ($secondary === '#059669') {
                $colors['secondary'] = '#1578D8';
                $changed = true;
            }
            if ($accent === '#065f46') {
                $colors['accent'] = '#FFC107';
                $changed = true;
            }

            if (! $changed) {
                continue;
            }

            $config['colors'] = $colors;

            if (isset($config['theme']['primary_color']) && strtolower((string) $config['theme']['primary_color']) === '#10b981') {
                $config['theme']['primary_color'] = '#1E90FF';
            }

            $row->config_sections = $config;
            $row->save();
        }
    }

    public function down(): void
    {
        // Non-reversible: installs may have chosen blue intentionally after migration.
    }
};
