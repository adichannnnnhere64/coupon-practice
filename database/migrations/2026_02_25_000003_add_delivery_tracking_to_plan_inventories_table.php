<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plan_inventories', function (Blueprint $table) {
            $table->enum('delivery_status', ['pending', 'queued', 'sending', 'sent', 'failed', 'delivered'])
                ->default('pending')
                ->after('status');
            $table->timestamp('delivered_at')->nullable()->after('sold_at');
            $table->integer('delivery_attempts')->default(0)->after('delivered_at');
            $table->timestamp('last_delivery_attempt_at')->nullable()->after('delivery_attempts');
            $table->json('delivery_metadata')->nullable()->after('last_delivery_attempt_at');

            $table->index('delivery_status');
        });
    }

    public function down(): void
    {
        Schema::table('plan_inventories', function (Blueprint $table) {
            $table->dropIndex(['delivery_status']);
            $table->dropColumn([
                'delivery_status',
                'delivered_at',
                'delivery_attempts',
                'last_delivery_attempt_at',
                'delivery_metadata',
            ]);
        });
    }
};
