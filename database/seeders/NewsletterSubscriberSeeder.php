<?php

namespace Database\Seeders;

use App\Models\NewsletterSubscription;
use App\Models\Store;
use Illuminate\Database\Seeder;

class NewsletterSubscriberSeeder extends Seeder
{
    public function run(): void
    {
        $stores = Store::all();

        foreach ($stores as $store) {
            // Create 10-20 newsletter subscribers per store
            $subscriberCount = rand(10, 20);
            
            for ($i = 0; $i < $subscriberCount; $i++) {
                NewsletterSubscription::create([
                    'store_id' => $store->id,
                    'email' => fake()->unique()->safeEmail(),
                    'is_active' => rand(0, 10) > 1, // 90% active
                    'subscribed_at' => fake()->dateTimeBetween('-6 months', 'now'),
                ]);
            }
        }

        $this->command->info('Created newsletter subscribers for all stores.');
    }
}