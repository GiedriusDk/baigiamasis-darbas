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
        Schema::create('workout_logs', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id');
            $t->unsignedBigInteger('workout_id');
            $t->date('date')->nullable();
            $t->unsignedSmallInteger('duration_min')->nullable();
            $t->unsignedTinyInteger('rpe_session')->nullable();
            $t->text('notes')->nullable();
            $t->timestamps();

            $t->index(['user_id','workout_id','date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workout_logs');
    }
};
