<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('splits', function (Blueprint $table) {
            $table->id();
            $table->string('goal');
            $table->unsignedTinyInteger('sessions_per_week');
            $table->string('slug')->unique();
            $table->jsonb('meta')->nullable();
            $table->timestamps();
            $table->unique(['goal', 'sessions_per_week']);
        });
    }

    public function down(): void {

        Schema::dropIfExists('splits');
    }
};