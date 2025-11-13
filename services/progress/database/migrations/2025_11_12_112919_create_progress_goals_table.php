<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('progress_goals', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->bigInteger('metric_id')->nullable()->index();
            $table->string('title', 200);
            $table->decimal('target_value', 10, 2)->nullable();
            $table->date('target_date')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->timestampsTz();
            $table->foreign('metric_id')->references('id')->on('progress_metrics')->onDelete('set null');
        });
    }
    public function down(): void {
        Schema::dropIfExists('progress_goals');
    }
};