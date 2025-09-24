<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('tags', function (Blueprint $t) {
      $t->id();
      $t->string('slug')->unique();
      $t->string('label');
      $t->string('group')->nullable();  
      $t->timestamps();
    });

    Schema::create('exercise_tag', function (Blueprint $t) {
      $t->unsignedBigInteger('exercise_id');
      $t->unsignedBigInteger('tag_id');
      $t->primary(['exercise_id','tag_id']);
      $t->foreign('exercise_id')->references('id')->on('exercises')->onDelete('cascade');
      $t->foreign('tag_id')->references('id')->on('tags')->onDelete('cascade');
      $t->index('tag_id');
      $t->index('exercise_id');
    });
  }

  public function down(): void {
    Schema::dropIfExists('exercise_tag');
    Schema::dropIfExists('tags');
  }
};