<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('display_name');
            $table->enum('type', ['email', 'sms', 'webhook', 'api', 'manual'])->default('email');
            $table->text('credentials')->nullable(); // Encrypted JSON for sensitive data
            $table->json('settings')->nullable(); // Non-sensitive settings
            $table->boolean('is_active')->default(true);
            $table->integer('retry_attempts')->default(3);
            $table->integer('retry_delay_seconds')->default(60);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_methods');
    }
};
