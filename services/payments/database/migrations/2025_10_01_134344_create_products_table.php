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
        Schema::create('products', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('coach_id')->index();
            $table->string('title', 160);
            $table->text('description')->nullable();
            $table->unsignedInteger('price');
            $table->char('currency', 3)->default('EUR');

            $table->boolean('is_active')->default(true)->index();
            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['coach_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
