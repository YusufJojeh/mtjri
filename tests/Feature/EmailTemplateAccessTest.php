<?php

use App\Models\Permission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests cannot access email templates index', function () {
    $this->get(route('email-templates.index'))->assertRedirect(route('login'));
});

test('authorized users with manage settings can access email templates index', function () {
    $user = User::factory()->create([
        'type' => 'superadmin',
    ]);

    $permission = Permission::findOrCreate('manage-settings', 'web');
    $user->givePermissionTo($permission);

    $this->actingAs($user)
        ->get(route('email-templates.index'))
        ->assertOk();
});
