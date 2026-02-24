<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->foreignId('delivery_method_id')
                ->nullable()
                ->after('low_stock_threshold')
                ->constrained('delivery_methods')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropForeign(['delivery_method_id']);
            $table->dropColumn('delivery_method_id');
        });
    }
};
