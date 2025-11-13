<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('progress_entries', function (Blueprint $table) {
            $table->date('date')->nullable()->after('metric_id');
            $table->index(['metric_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::table('progress_entries', function (Blueprint $table) {
            $table->dropColumn('date');
        });
    }
};