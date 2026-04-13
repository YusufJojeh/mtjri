<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlanFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Plan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->word,
            'max_stores' => $this->faker->numberBetween(1, 10),
            'max_products_per_store' => $this->faker->numberBetween(10, 100),
            'max_users_per_store' => $this->faker->numberBetween(1, 5),
            'price' => $this->faker->randomFloat(2, 10, 100),
            'duration' => $this->faker->randomElement(['month', 'year']),
            'description' => $this->faker->sentence,
            'is_plan_enable' => $this->faker->boolean,
            'is_default' => false,
            'enable_custdomain' => $this->faker->boolean,
            'enable_custsubdomain' => $this->faker->boolean,
            'trial_day' => $this->faker->numberBetween(0, 30),
            'themes' => [
                'theme1',
                'theme2',
            ],
        ];
    }

    /**
     * Indicate that the plan is active.
     */
    public function active(): Factory
    {
        return $this->state(fn (array $attributes) => [
            'is_plan_enable' => true,
        ]);
    }

    /**
     * Indicate that the plan is the default.
     */
    public function default(): Factory
    {
        return $this->state(fn (array $attributes) => [
            'is_default' => true,
        ]);
    }
}
