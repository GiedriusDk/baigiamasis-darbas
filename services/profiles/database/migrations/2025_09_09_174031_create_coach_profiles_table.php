<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('coach_profiles', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id')->unique(); // iš tokeno
            $t->text('bio')->nullable();
            $t->string('city')->nullable();
            $t->unsignedSmallInteger('experience_years')->default(0);
            $t->unsignedInteger('price_per_session')->default(0);
            $t->json('specializations')->nullable();
            $t->text('availability_note')->nullable();
            $t->string('avatar_path')->nullable(); // /storage/...
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_profiles');
    }
};