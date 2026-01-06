<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $t) {

            $t->renameColumn('name', 'first_name');

            $t->string('last_name', 120)->nullable()->after('first_name');
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $t) {
            $t->renameColumn('first_name', 'name');
            $t->dropColumn('last_name');
        });
    }
};
