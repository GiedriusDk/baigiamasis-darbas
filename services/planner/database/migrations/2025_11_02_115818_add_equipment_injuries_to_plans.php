<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void {
        Schema::table('plans', function (Blueprint $t) {
            $t->string('equipment', 60)->nullable()->after('start_date');
            $t->jsonb('injuries')->nullable()->after('session_minutes');
        });
    }
    public function down(): void {
        Schema::table('plans', function (Blueprint $t) {
            $t->dropColumn(['equipment','injuries']);
        });
    }
};
