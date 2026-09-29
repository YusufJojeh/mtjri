<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The platform (superadmin) theme drives public and auth pages. Move it from
 * the legacy seeded default ("green") to the Tijraa brand preset. Merchant
 * store themes are merchant choices and are left unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        $platformUserIds = DB::table('users')->whereIn('type', ['superadmin', 'super admin'])->pluck('id');
        if ($platformUserIds->isEmpty()) {
            return;
        }
        DB::table('settings')
            ->whereIn('user_id', $platformUserIds)
            ->where('key', 'themeColor')
            ->where('value', 'green')
            ->update(['value' => 'tijraa']);
    }

    public function down(): void
    {
    }
};
