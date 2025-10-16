<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('plan_day_exercises', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('plans')->onDelete('cascade');
            $table->foreignId('plan_day_id')->constrained('plan_days')->onDelete('cascade');
            $table->unsignedBigInteger('exercise_id')->nullable()->index();
            $table->string('custom_title')->nullable();
            $table->text('custom_notes')->nullable();
            $table->integer('order')->default(1)->index();
            $table->integer('sets')->nullable();
            $table->integer('reps')->nullable();
            $table->integer('rest_seconds')->nullable();
            $table->timestamps();
            $table->unique(['plan_day_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_day_exercises');
    }
};