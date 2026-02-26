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
        // Create pivot table
        Schema::create('category_plan_type', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_type_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['category_id', 'plan_type_id']);
        });

        // Migrate existing category_id data to pivot table
        DB::statement('
            INSERT INTO category_plan_type (category_id, plan_type_id, created_at, updated_at)
            SELECT category_id, id, NOW(), NOW()
            FROM plan_types
            WHERE category_id IS NOT NULL
        ');

        // Drop the old category_id column
        Schema::table('plan_types', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn('category_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add category_id column
        Schema::table('plan_types', function (Blueprint $table) {
            $table->foreignId('category_id')->nullable()->after('id')->constrained()->nullOnDelete();
        });

        // Migrate data back (take first category for each plan_type)
        DB::statement('
            UPDATE plan_types pt
            SET category_id = (
                SELECT category_id
                FROM category_plan_type cpt
                WHERE cpt.plan_type_id = pt.id
                LIMIT 1
            )
        ');

        Schema::dropIfExists('category_plan_type');
    }
};
