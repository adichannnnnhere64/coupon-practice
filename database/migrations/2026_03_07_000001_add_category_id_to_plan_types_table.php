<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if category_id column doesn't exist before adding
        if (!Schema::hasColumn('plan_types', 'category_id')) {
            Schema::table('plan_types', function (Blueprint $table) {
                $table->foreignId('category_id')->nullable()->after('id')->constrained()->nullOnDelete();
            });

            // Migrate data from pivot table back to category_id (take first category for each plan_type)
            if (Schema::hasTable('category_plan_type')) {
                DB::statement('
                    UPDATE plan_types pt
                    SET category_id = (
                        SELECT category_id
                        FROM category_plan_type cpt
                        WHERE cpt.plan_type_id = pt.id
                        LIMIT 1
                    )
                    WHERE EXISTS (
                        SELECT 1 FROM category_plan_type cpt WHERE cpt.plan_type_id = pt.id
                    )
                ');
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('plan_types', 'category_id')) {
            Schema::table('plan_types', function (Blueprint $table) {
                $table->dropForeign(['category_id']);
                $table->dropColumn('category_id');
            });
        }
    }
};
