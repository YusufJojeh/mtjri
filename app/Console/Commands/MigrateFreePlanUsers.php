<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Plan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MigrateFreePlanUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'plans:migrate-free-users';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate users from free plan to the lowest paid plan';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting migration of free plan users...');

        // Find the free plan (default plan)
        $freePlan = Plan::where('is_default', true)->first();

        if (!$freePlan) {
            $this->warn('No free plan found. Migration skipped.');
            return 0;
        }

        // Find the lowest paid plan (non-default, lowest price)
        $lowestPaidPlan = Plan::where('is_default', false)
            ->where('is_plan_enable', 'on')
            ->where('price', '>', 0)
            ->orderBy('price', 'asc')
            ->first();

        if (!$lowestPaidPlan) {
            $this->error('No paid plan found. Cannot migrate users.');
            return 1;
        }

        $this->info("Free plan: {$freePlan->name} (ID: {$freePlan->id})");
        $this->info("Lowest paid plan: {$lowestPaidPlan->name} (ID: {$lowestPaidPlan->id}, Price: {$lowestPaidPlan->price})");

        // Find all users with the free plan
        $users = User::where('plan_id', $freePlan->id)
            ->where('type', 'company')
            ->get();

        $this->info("Found {$users->count()} users to migrate.");

        if ($users->count() === 0) {
            $this->info('No users to migrate.');
            return 0;
        }

        // Confirm migration
        if (!$this->confirm('Do you want to proceed with the migration?', true)) {
            $this->info('Migration cancelled.');
            return 0;
        }

        $migrated = 0;
        $failed = 0;

        DB::beginTransaction();
        try {
            foreach ($users as $user) {
                try {
                    $user->plan_id = $lowestPaidPlan->id;
                    $user->plan_is_active = 1;
                    $user->save();

                    $migrated++;
                    Log::info("Migrated user {$user->id} ({$user->email}) from free plan to {$lowestPaidPlan->name}");
                } catch (\Exception $e) {
                    $failed++;
                    Log::error("Failed to migrate user {$user->id}: " . $e->getMessage());
                    $this->error("Failed to migrate user {$user->id}: " . $e->getMessage());
                }
            }

            DB::commit();
            $this->info("Migration completed successfully!");
            $this->info("Migrated: {$migrated} users");
            if ($failed > 0) {
                $this->warn("Failed: {$failed} users");
            }
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("Migration failed: " . $e->getMessage());
            Log::error("Migration failed: " . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
