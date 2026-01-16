<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('plan_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_type_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->decimal('base_price', 10, 2);
            $table->decimal('actual_price', 10, 2);
            $table->text('description')->nullable();
            $table->json('meta_data')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('plan_attributes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('type')->default('text'); // text, number, boolean
            $table->string('unit')->nullable(); // GB, minutes, SMS
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('plan_plan_attribute', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            $table->foreignId('plan_attribute_id')->constrained()->onDelete('cascade');
            $table->string('value')->nullable();
            $table->boolean('is_unlimited')->default(false);
            $table->timestamps();

            $table->unique(['plan_id', 'plan_attribute_id']);
        });

        Schema::create('plan_inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained()->onDelete('cascade');
            $table->string('code')->unique();
            $table->enum('status', ['available', 'reserved', 'sold', 'expired', 'damaged'])->default('available');
            $table->timestamp('purchased_at')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('meta_data')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['plan_id', 'status']);
            $table->index('code');
        });
    }

    public function down()
    {
        Schema::dropIfExists('plan_inventories');
        Schema::dropIfExists('plan_plan_attribute');
        Schema::dropIfExists('plan_attributes');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('plan_types');
    }
};
