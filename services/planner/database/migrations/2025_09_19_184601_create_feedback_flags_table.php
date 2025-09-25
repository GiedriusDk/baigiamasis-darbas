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
        Schema::create('feedback_flags', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('log_id');
            $t->jsonb('too_easy')->nullable(); 
            $t->jsonb('too_hard')->nullable();
            $t->jsonb('pain')->nullable();
            $t->text('comments')->nullable();
            $t->timestamps();

            $t->index('log_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feedback_flags');
    }
};
