<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('progress_goal_checkins', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('goal_id')->index();
            $table->bigInteger('user_id')->index();
            $table->bigInteger('entry_id')->nullable()->index();
            $table->boolean('achieved')->default(false)->index();
            $table->text('note')->nullable();
            $table->timestampsTz();
            $table->foreign('goal_id')->references('id')->on('progress_goals')->onDelete('cascade');
            $table->foreign('entry_id')->references('id')->on('progress_entries')->onDelete('set null');
        });
    }
    public function down(): void {
        Schema::dropIfExists('progress_goal_checkins');
    }
};