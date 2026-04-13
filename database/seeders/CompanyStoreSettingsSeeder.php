<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Store;
use Illuminate\Database\Seeder;

class CompanyStoreSettingsSeeder extends Seeder
{
    public function run(): void
    {
        // Get all company users
        $companyUsers = User::where('type', 'company')->get();
        
        if ($companyUsers->isEmpty()) {
            $this->command->error('No company users found.');
            return;
        }

        $totalStores = 0;
        
        foreach ($companyUsers as $companyUser) {
            $stores = Store::where('user_id', $companyUser->id)->get();
            
            foreach ($stores as $store) {
                // Check if store-specific settings already exist
                $existingSettings = \App\Models\Setting::where('user_id', $companyUser->id)
                    ->where('store_id', $store->id)
                    ->count();
                    
                if ($existingSettings == 0) {
                    copySettingsFromSuperAdmin($companyUser->id, $store->id);
                }
                $totalStores++;
            }
        }
        
        $this->command->info("Created store-specific settings for {$totalStores} stores.");
    }
}