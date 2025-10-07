<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->bigIncrements('id');

            $table->unsignedBigInteger('coach_id')->index();

            $table->string('title', 160);
            $table->string('slug', 180)->unique();
            $table->text('description')->nullable();

            $table->unsignedInteger('price');
            $table->char('currency', 3)->default('EUR');

            $table->string('type', 20)->default('online')->index();

            $table->string('gym_name')->nullable();
            $table->string('gym_address')->nullable();

            $table->unsignedSmallInteger('duration_weeks')->nullable();
            $table->unsignedSmallInteger('sessions_per_week')->nullable();
            $table->unsignedSmallInteger('access_days')->nullable();

            $table->boolean('includes_chat')->default(true);
            $table->boolean('includes_calls')->default(false);

            $table->string('level', 24)->nullable();
            $table->string('thumbnail_url')->nullable();

            $table->integer('sort_order')->default(0)->index();
            $table->boolean('is_active')->default(true)->index();

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['coach_id', 'is_active', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};