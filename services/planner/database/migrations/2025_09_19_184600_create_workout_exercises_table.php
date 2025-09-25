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
        Schema::create('workout_exercises', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('workout_id');
            $t->unsignedBigInteger('exercise_id');
            $t->unsignedSmallInteger('order')->default(1);
            $t->unsignedTinyInteger('sets')->default(3);
            $t->unsignedTinyInteger('rep_min')->nullable();
            $t->unsignedTinyInteger('rep_max')->nullable();
            $t->unsignedSmallInteger('rest_sec')->nullable();
            $t->jsonb('prescription')->nullable(); 
            $t->timestamps();

            $t->index(['workout_id','order']);
            $t->index('exercise_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workout_exercises');
    }
};
