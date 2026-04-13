<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('name');
            $table->string('name_en')->nullable()->after('name_ar');
            $table->string('industry')->nullable()->after('name_en');
            $table->string('logo')->nullable()->after('industry');
            $table->string('color')->nullable()->after('logo');
            $table->boolean('pay_with_whatsapp')->default(false)->after('color');
            $table->string('whatsapp_number')->nullable()->after('pay_with_whatsapp');
            // Make existing 'name' column nullable as it will be populated by name_en or name_ar
            $table->string('name')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['name_ar', 'name_en', 'industry', 'logo', 'color', 'pay_with_whatsapp', 'whatsapp_number']);
            // Revert 'name' column to not nullable if it was originally
            // This assumes 'name' was originally not nullable. Adjust if necessary for your schema.
            $table->string('name')->nullable(false)->change();
        });
    }
};
