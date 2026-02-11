<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            if (!Schema::hasColumn('plans', 'inventory_enabled')) {
                $table->boolean('inventory_enabled')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('plans', 'low_stock_threshold')) {
                $table->integer('low_stock_threshold')->default(5)->after('inventory_enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['inventory_enabled', 'low_stock_threshold']);
        });
    }
};
