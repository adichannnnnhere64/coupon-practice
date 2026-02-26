<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->nullableMorphs('transactionable');

            // Add description and metadata columns
            if (! Schema::hasColumn('transactions', 'description')) {
                $table->text('description')->nullable()->after('total');
            }

            if (! Schema::hasColumn('transactions', 'metadata')) {
                $table->json('metadata')->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropMorphs('transactionable');
            $table->dropColumn(['description', 'metadata']);
        });
    }
};
