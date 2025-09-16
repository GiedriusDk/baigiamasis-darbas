<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_profiles', function (Blueprint $t) {
            $t->id();
            // cross-service FK nededam (users yra auth servise)
            $t->unsignedBigInteger('user_id')->unique()->index();

            $t->enum('sex', ['male','female','other'])->nullable();
            $t->date('birth_date')->nullable();

            $t->smallInteger('height_cm')->nullable();                  // 100..250
            $t->decimal('weight_kg', 5, 2)->nullable();                 // 30..400.00

            $t->enum('goal', ['fat_loss','muscle_gain','performance','general_fitness'])->nullable();
            $t->enum('activity_level', ['sedentary','light','moderate','active','very_active'])->nullable();

            $t->tinyInteger('sessions_per_week')->nullable();           // 0..14
            $t->smallInteger('available_minutes')->nullable();          // 0..300

            $t->json('preferred_days')->nullable();                     // ['mon','wed','fri']
            $t->json('equipment')->nullable();                          // ['dumbbells','barbell']
            $t->json('preferences')->nullable();                        // laisvas JSON

            $t->text('injuries_note')->nullable();
            $t->string('avatar_path')->nullable();                      // ateičiai

            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};