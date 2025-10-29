<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->string('gym_name')->nullable();
            $table->string('gym_address')->nullable();
        });
    }

    public function down()
    {
        Schema::table('coach_profiles', function (Blueprint $table) {
            $table->dropColumn(['gym_name', 'gym_address']);
        });
    }
};
