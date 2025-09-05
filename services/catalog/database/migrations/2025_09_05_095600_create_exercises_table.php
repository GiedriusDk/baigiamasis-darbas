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
        Schema::create('exercises', function (Blueprint $t) {
            $t->id();
            $t->string('name');
            $t->string('primary_muscle')->nullable();
            $t->string('equipment')->nullable();
            $t->text('image_url')->nullable();     // GIF ar img
            $t->string('source')->default('exercisedb');
            $t->string('source_id')->nullable();   // išorinis ID
            $t->json('tags')->nullable();
            $t->timestamps();

            $t->unique(['source', 'source_id']);
            $t->index('name');
            $t->index('primary_muscle');
            $t->index('equipment');
        });
        }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exercises');
    }
};
