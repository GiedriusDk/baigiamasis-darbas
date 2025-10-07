<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('coach_profiles', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id')->unique();
            $t->text('bio')->nullable();
            $t->string('city')->nullable();
            $t->string('country')->nullable();
            $t->unsignedSmallInteger('experience_years')->default(0);
            $t->json('specializations')->nullable();
            $t->text('availability_note')->nullable();
            $t->json('socials')->nullable();
            $t->string('avatar_path')->nullable();
            $t->string('timezone')->nullable();
            $t->json('languages')->nullable();
            $t->json('certifications')->nullable();
            $t->string('phone')->nullable();
            $t->string('website_url')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_profiles');
    }
};