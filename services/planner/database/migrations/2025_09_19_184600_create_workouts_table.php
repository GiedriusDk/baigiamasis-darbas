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
        Schema::create('workouts', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('plan_id');
            $t->unsignedTinyInteger('day_index'); 
            $t->string('name')->nullable(); 
            $t->text('notes')->nullable();
            $t->timestamps();

            $t->index(['plan_id','day_index']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workouts');
    }
};
