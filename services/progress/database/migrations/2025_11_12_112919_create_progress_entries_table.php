<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('progress_entries', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->bigInteger('metric_id')->index();
            $table->decimal('value', 10, 2)->nullable();
            $table->jsonb('value_json')->nullable();
            $table->text('note')->nullable();
            $table->timestampTz('recorded_at')->index();
            $table->string('source', 50)->nullable();
            $table->timestampsTz();
            $table->foreign('metric_id')->references('id')->on('progress_metrics')->onDelete('cascade');
            $table->unique(['user_id','metric_id','recorded_at']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('progress_entries');
    }
};