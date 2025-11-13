<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('progress_photos', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->bigInteger('entry_id')->nullable()->index();
            $table->string('path', 255);
            $table->smallInteger('width')->nullable();
            $table->smallInteger('height')->nullable();
            $table->string('pose', 30)->nullable();
            $table->timestampTz('taken_at')->nullable()->index();
            $table->timestampsTz();
            $table->foreign('entry_id')->references('id')->on('progress_entries')->onDelete('set null');
        });
    }
    public function down(): void {
        Schema::dropIfExists('progress_photos');
    }
};