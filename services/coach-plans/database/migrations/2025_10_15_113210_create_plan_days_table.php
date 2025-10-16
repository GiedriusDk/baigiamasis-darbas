<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('plan_days', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('plans')->onDelete('cascade');
            $table->foreignId('plan_week_id')->constrained('plan_weeks')->onDelete('cascade');
            $table->integer('week_number')->default(1);
            $table->integer('day_number');
            $table->string('title')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->unique(['plan_week_id', 'day_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_days');
    }
};