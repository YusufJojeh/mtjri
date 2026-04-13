<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Store>
 */
class StoreFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
                        'user_id' => \App\Models\User::factory(),
            'name_ar' => $this->faker->company . ' (AR)',
            'name_en' => $this->faker->company . ' (EN)',
            'name' => $this->faker->company, // Keep for backward compatibility or default
            'slug' => $this->faker->slug,
            'description' => $this->faker->paragraph,
            'industry' => $this->faker->word,
            'logo' => null, // Placeholder for logo path
            'color' => $this->faker->hexColor,
            'pay_with_whatsapp' => $this->faker->boolean,
            'whatsapp_number' => $this->faker->optional()->phoneNumber,
            'email' => $this->faker->unique()->safeEmail,
            'theme' => 'default', // Default theme
            'is_active' => true,
        ];
    }
}
