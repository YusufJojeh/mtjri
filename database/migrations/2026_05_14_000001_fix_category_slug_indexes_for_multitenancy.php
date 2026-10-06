<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('categories')) {
            return;
        }

        $this->dropIndexIfExists('categories', 'categories_slug_unique');

        if (! $this->indexExists('categories', 'categories_slug_store_id_unique')) {
            DB::statement('CREATE UNIQUE INDEX categories_slug_store_id_unique ON categories (slug, store_id)');
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('categories')) {
            return;
        }

        $this->dropIndexIfExists('categories', 'categories_slug_store_id_unique');

        if (! $this->indexExists('categories', 'categories_slug_unique')) {
            DB::statement('CREATE UNIQUE INDEX categories_slug_unique ON categories (slug)');
        }
    }

    private function dropIndexIfExists(string $table, string $index): void
    {
        if (! $this->indexExists($table, $index)) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement(sprintf('ALTER TABLE %s DROP INDEX %s', $table, $index));
            return;
        }

        DB::statement(sprintf('DROP INDEX %s', $index));
    }

    private function indexExists(string $table, string $index): bool
    {
        return match (DB::getDriverName()) {
            'sqlite' => collect(DB::select("PRAGMA index_list('{$table}')"))
                ->contains(fn ($row) => ($row->name ?? null) === $index),
            'mysql' => collect(DB::select("SHOW INDEX FROM `{$table}`"))
                ->contains(fn ($row) => ($row->Key_name ?? null) === $index),
            default => false,
        };
    }
};
