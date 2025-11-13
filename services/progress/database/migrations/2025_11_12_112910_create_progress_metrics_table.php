<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('progress_metrics', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->string('slug', 100);
            $table->string('name', 150);
            $table->string('unit', 50)->nullable();
            $table->string('kind', 30)->default('scalar');
            $table->boolean('is_public')->default(false);
            $table->timestampsTz();
            $table->unique(['user_id','slug']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('progress_metrics');
    }
};