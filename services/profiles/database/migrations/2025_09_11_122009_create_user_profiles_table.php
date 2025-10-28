<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id')->unique()->index();

            $t->enum('sex', ['male','female','other'])->nullable();
            $t->date('birth_date')->nullable();

            $t->smallInteger('height_cm')->nullable();
            $t->decimal('weight_kg', 5, 2)->nullable();

            $t->enum('goal', ['fat_loss','muscle_gain','performance','general_fitness'])->nullable();
            $t->enum('activity_level', ['sedentary','light','moderate','active','very_active'])->nullable();

            $t->tinyInteger('sessions_per_week')->nullable();
            $t->smallInteger('available_minutes')->nullable();

            $t->json('preferred_days')->nullable();
            $t->json('equipment')->nullable();
            $t->json('preferences')->nullable();

            $t->json('injuries')->nullable();
            $t->string('avatar_path')->nullable();

            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};