<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('coach_exercises', function (Blueprint $table) {
            $table->unsignedBigInteger('catalog_id')->nullable()->after('user_id');
            $table->timestamp('imported_at')->nullable()->after('catalog_id');
            $table->index(['user_id', 'catalog_id']);
        });
    }

    public function down(): void {
        Schema::table('coach_exercises', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'catalog_id']);
            $table->dropColumn(['catalog_id', 'imported_at']);
        });
    }
};