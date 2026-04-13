<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Set is_default = false for all plans (removes free plan default status)
        // This should be run AFTER migrating users with the command
        DB::table('plans')->where('is_default', true)->update(['is_default' => false]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Find the lowest price plan and set it as default
        $lowestPricePlan = DB::table('plans')
            ->where('price', DB::table('plans')->min('price'))
            ->first();
        
        if ($lowestPricePlan) {
            DB::table('plans')->where('id', $lowestPricePlan->id)->update(['is_default' => true]);
        }
    }
};
