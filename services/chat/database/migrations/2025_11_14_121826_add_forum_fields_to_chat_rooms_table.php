<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_rooms', function (Blueprint $table) {
            $table->string('type')->default('private')->after('id');
            $table->string('title')->nullable()->after('type');
            $table->string('slug')->nullable()->unique()->after('title');
        });

        DB::table('chat_rooms')->updateOrInsert(
            ['slug' => 'forum-sport'],
            [
                'type'      => 'forum',
                'title'     => 'Sport',
                'created_at'=> now(),
                'updated_at'=> now(),
            ],
        );

        DB::table('chat_rooms')->updateOrInsert(
            ['slug' => 'forum-nutrition'],
            [
                'type'      => 'forum',
                'title'     => 'Nutrition',
                'created_at'=> now(),
                'updated_at'=> now(),
            ],
        );
    }

    public function down(): void
    {
        DB::table('chat_rooms')
            ->whereIn('slug', ['forum-sport', 'forum-nutrition'])
            ->delete();

        Schema::table('chat_rooms', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn(['type', 'title', 'slug']);
        });
    }
};