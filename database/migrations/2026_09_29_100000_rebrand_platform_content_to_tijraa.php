<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Rebrand platform-owned stored text (site title/footer defaults, landing
 * page and platform pages) to "Tijraa". Merchant-authored content (store
 * pages, products, blog posts) is intentionally not touched.
 */
return new class extends Migration
{
    private const TABLES = ['settings', 'landing_page_settings', 'landing_page_custom_pages', 'email_template_langs'];

    /** Ordered, case-sensitive replacements. */
    private const REPLACEMENTS = [
        'https://mtjrii.com/storage/placeholder/' => '/storage/placeholder/',
        'yourstore.matjrii.com' => 'yourstore.tijraa.com',
        'mystore.matjrii.com' => 'mystore.tijraa.com',
        'mtjrii.com' => 'tijraa.com',
        'storego.com' => 'tijraa.com',
        '© 2025 StoreGo SaaS. Powered by WorkDo.' => '© 2026 Tijraa. All rights reserved.',
        'StoreGo SaaS' => 'Tijraa',
        'MTJRii' => 'Tijraa',
        'MATJRII' => 'Tijraa',
        'Matjrii' => 'Tijraa',
        'Mtjrii' => 'Tijraa',
        'StoreGo' => 'Tijraa',
        'Storego' => 'Tijraa',
        'storego' => 'tijraa',
        'mtjrii' => 'tijraa',
        'matjrii' => 'tijraa',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }
            foreach (Schema::getColumns($table) as $column) {
                if (! preg_match('/char|text|json|clob/i', (string) $column['type'])) {
                    continue;
                }
                $name = $column['name'];
                foreach (self::REPLACEMENTS as $from => $to) {
                    DB::table($table)
                        ->where($name, 'like', '%' . $from . '%')
                        ->update([$name => DB::raw('REPLACE(' . DB::getQueryGrammar()->wrap($name) . ', ' . DB::getPdo()->quote($from) . ', ' . DB::getPdo()->quote($to) . ')')]);
                }
            }
        }
    }

    public function down(): void
    {
        // Irreversible by design: the previous brand must not return.
    }
};
