<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        Schema::table('exercises', function (Blueprint $t) {
            $t->jsonb('body_parts')->nullable();
            $t->jsonb('target_muscles')->nullable();
            $t->jsonb('secondary_muscles')->nullable();
            $t->jsonb('equipments_j')->nullable(); // pilnas sąrašas
            $t->jsonb('instructions')->nullable();
            $t->jsonb('keywords')->nullable();
        });

        // GIN indeksai paieškai/filtrams
        DB::statement('CREATE INDEX IF NOT EXISTS idx_ex_body_parts ON exercises USING GIN (body_parts);');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_ex_target_muscles ON exercises USING GIN (target_muscles);');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_ex_secondary_muscles ON exercises USING GIN (secondary_muscles);');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_ex_equipments_j ON exercises USING GIN (equipments_j);');
        DB::statement('CREATE INDEX IF NOT EXISTS idx_ex_keywords ON exercises USING GIN (keywords);');
    }

    public function down(): void {
        Schema::table('exercises', function (Blueprint $t) {
            $t->dropColumn(['body_parts','target_muscles','secondary_muscles','equipments_j','instructions','keywords']);
        });
        DB::statement('DROP INDEX IF EXISTS idx_ex_body_parts;');
        DB::statement('DROP INDEX IF EXISTS idx_ex_target_muscles;');
        DB::statement('DROP INDEX IF EXISTS idx_ex_secondary_muscles;');
        DB::statement('DROP INDEX IF EXISTS idx_ex_equipments_j;');
        DB::statement('DROP INDEX IF EXISTS idx_ex_keywords;');
    }
};
