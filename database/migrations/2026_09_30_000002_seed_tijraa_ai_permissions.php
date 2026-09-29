<?php

use App\Ai\AiPermissions;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/** Grant the AI platform permissions to existing company and superadmin roles. */
return new class extends Migration
{
    public function up(): void
    {
        foreach (AiPermissions::definitions() as $p) {
            \App\Models\Permission::firstOrCreate(
                ['name' => $p['name'], 'guard_name' => 'web'],
                ['module' => $p['module'], 'label' => $p['label'], 'description' => $p['description']]
            );
        }
        foreach (['company', 'superadmin'] as $roleName) {
            $role = Role::where('name', $roleName)->where('guard_name', 'web')->first();
            $role?->givePermissionTo(AiPermissions::names());
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
    }
};
