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
        Schema::create('payments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('order_id')->index();
            $table->string('provider', 32)->index();
            $table->string('provider_txn_id', 128)->nullable()->unique();
            $table->unsignedInteger('amount');
            $table->char('currency', 3)->default('EUR');
            $table->enum('status', ['initiated', 'succeeded', 'failed', 'refunded'])->default('initiated')->index();
            $table->timestamp('paid_at')->nullable()->index();
            $table->json('raw_response')->nullable(); 
            $table->timestamps();

            $table->index(['order_id', 'status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
