<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add inventory fields to plans table
        Schema::table('plans', function (Blueprint $table) {
            if (!Schema::hasColumn('plans', 'inventory_enabled')) {
                $table->boolean('inventory_enabled')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('plans', 'low_stock_threshold')) {
                $table->integer('low_stock_threshold')->default(5)->after('inventory_enabled');
            }
        });

        // Update plan_inventories table
        Schema::table('plan_inventories', function (Blueprint $table) {
            if (!Schema::hasColumn('plan_inventories', 'user_id')) {
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete()->after('plan_id');
            }

            // Add indexes for better performance
            $table->index(['status', 'plan_id']);
            $table->index(['user_id', 'status']);
            $table->index('expires_at');
            /* $table->index('code'); */
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['inventory_enabled', 'low_stock_threshold']);
        });

        Schema::table('plan_inventories', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            $table->dropIndex(['status', 'plan_id']);
            $table->dropIndex(['user_id', 'status']);
            $table->dropIndex(['expires_at']);
            /* $table->dropIndex(['code']); */
        });
    }
};
