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
        Schema::create('orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('product_id')->index();
            $table->uuid('public_id')->unique();
            $table->unsignedInteger('amount');
            $table->char('currency', 3)->default('EUR');
            $table->enum('status', ['pending', 'paid', 'cancelled', 'refunded'])->default('pending')->index();
            $table->timestamp('paid_at')->nullable()->index();
            $table->timestamp('expires_at')->nullable()->index();

            $table->json('metadata')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
