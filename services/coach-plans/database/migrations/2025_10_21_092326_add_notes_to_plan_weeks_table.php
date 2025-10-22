<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('plan_weeks', function (Blueprint $table) {
            if (!Schema::hasColumn('plan_weeks', 'notes')) {
                $table->text('notes')->nullable();
            }
        });

    }

    public function down(): void
    {
        Schema::table('plan_weeks', function (Blueprint $table) {
            if (Schema::hasColumn('plan_weeks', 'notes')) {
                $table->dropColumn('notes');
            }
        });

    }
};