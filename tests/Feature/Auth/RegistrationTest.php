<?php

use App\Models\User;
use App\Models\Setting;
use App\Models\Store;
use Illuminate\Support\Facades\Auth;

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

test('legacy registration route redirects to the registration stepper', function () {
    $response = $this->get('/register');

    $response->assertRedirect(route('register.stepper.index'));
});

test('registration stepper screen can be rendered', function () {
    $response = $this->get(route('register.stepper.index'));

    $response->assertStatus(200);
});

test('new users can register via the registration stepper', function () {
    $response = $this->postJson(route('register.stepper.step1'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'terms' => true,
    ]);

    $response->assertOk()->assertJsonPath('success', true);

    $this->assertAuthenticated();
    $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    expect(Store::where('user_id', Auth::id())->exists())->toBeTrue();
});
