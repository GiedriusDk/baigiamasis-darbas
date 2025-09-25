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
        Schema::create('plans', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id');
            $t->string('goal')->nullable();
            $t->unsignedTinyInteger('sessions_per_week')->default(3);
            $t->date('start_date')->nullable();
            $t->unsignedTinyInteger('weeks')->default(8);
            $t->jsonb('meta')->nullable();
            $t->timestamps();

            $t->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
