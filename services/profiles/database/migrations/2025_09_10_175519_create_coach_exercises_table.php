<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('coach_exercises', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();

            $table->string('title');
            $table->text('description')->nullable();

            $table->string('equipment', 120)->nullable();
            $table->string('primary_muscle', 120)->nullable();
            $table->string('difficulty', 16)->nullable();

            $table->json('tags')->nullable();

            $table->string('media_path')->nullable();
            $table->string('media_type', 20)->nullable();
            $table->string('external_url')->nullable();

            $table->integer('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('coach_exercises');
    }
};