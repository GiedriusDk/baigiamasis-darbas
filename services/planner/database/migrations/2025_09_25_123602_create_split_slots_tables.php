<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('split_slots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('split_day_id')->constrained('split_days')->cascadeOnDelete();
            $table->string('tag');
            $table->unsignedTinyInteger('count')->default(1);
            $table->unsignedTinyInteger('min_compound')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('split_slots');
    }
};
