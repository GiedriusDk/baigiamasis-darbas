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
        Schema::create('set_logs', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('log_id');
            $t->unsignedBigInteger('exercise_id');
            $t->unsignedTinyInteger('set_index');
            $t->decimal('weight', 6, 2)->nullable();
            $t->unsignedSmallInteger('reps')->nullable();
            $t->unsignedTinyInteger('rpe')->nullable();
            $t->timestamps();

            $t->index(['log_id','exercise_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('set_logs');
    }
};
