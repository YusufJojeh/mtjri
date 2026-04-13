<?php

use App\Models\User;
use App\Models\Setting;

beforeEach(function () {
    // Create a superadmin user and ensure landingPageEnabled is true
    $superAdmin = User::where('type', 'superadmin')->first();
    if (!$superAdmin) {
        $superAdmin = User::factory()->create(['type' => 'superadmin']);
    }
    Setting::updateOrCreate(
        ['user_id' => $superAdmin->id, 'key' => 'landingPageEnabled'],
        ['value' => '1'] // Ensure it's explicitly '1' for true
    );
});

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});