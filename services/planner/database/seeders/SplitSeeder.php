<?php


namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SplitSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('TRUNCATE TABLE split_slots, split_days, splits RESTART IDENTITY CASCADE');

        $spec = [
            ['goal' => 'muscle_gain', 'sessions' => 2, 'slug' => 'mg_2_ul',      'days' => ['Upper','Lower']],
            ['goal' => 'muscle_gain', 'sessions' => 3, 'slug' => 'mg_3_ppl',     'days' => ['Push','Pull','Legs']],
            ['goal' => 'muscle_gain', 'sessions' => 4, 'slug' => 'mg_4_ulul',    'days' => ['Upper','Lower','Upper','Lower']],

            ['goal' => 'fat_loss',    'sessions' => 2, 'slug' => 'fl_2_fb_card', 'days' => ['Full Body','Cardio']],
            ['goal' => 'fat_loss',    'sessions' => 3, 'slug' => 'fl_3_fbfbcard','days' => ['Full Body','Full Body','Cardio']],
            ['goal' => 'fat_loss',    'sessions' => 4, 'slug' => 'fl_4_ulfbcard','days' => ['Upper','Lower','Full Body','Cardio']],

            ['goal' => 'general_fitness', 'sessions' => 2, 'slug' => 'gf_2_ul',   'days' => ['Upper','Lower']],
            ['goal' => 'general_fitness', 'sessions' => 3, 'slug' => 'gf_3_ulfb', 'days' => ['Upper','Lower','Full Body']],
            ['goal' => 'general_fitness', 'sessions' => 4, 'slug' => 'gf_4_ulul', 'days' => ['Upper','Lower','Upper','Lower']],
        ];

        foreach ($spec as $row) {
            $splitId = DB::table('splits')->insertGetId([
                'goal'              => $row['goal'],
                'sessions_per_week' => $row['sessions'],
                'slug'              => $row['slug'],
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);

            foreach ($row['days'] as $i => $name) {
                $dayId = DB::table('split_days')->insertGetId([
                    'split_id'   => $splitId,
                    'day_index'  => $i,
                    'name'       => $name,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('split_slots')->insert(
                    array_map(fn($s) => [
                        'split_day_id'  => $dayId,
                        'tag'           => $s['tag'],
                        'count'         => $s['count'],
                        'min_compound'  => $s['min_compound'],
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ], $this->slotsFor($name))
                );
            }
        }
    }

    private function slotsFor(string $day): array
    {
        return match ($day) {
            'Upper' => [
                ['tag'=>'horizontal_push',     'count'=>1, 'min_compound'=>1],
                ['tag'=>'horizontal_pull',     'count'=>1, 'min_compound'=>1],
                ['tag'=>'vertical_push',       'count'=>1, 'min_compound'=>0],
                ['tag'=>'vertical_pull',       'count'=>1, 'min_compound'=>0],
                ['tag'=>'core_anti_extension', 'count'=>1, 'min_compound'=>0],
            ],
            'Lower' => [
                ['tag'=>'squat',               'count'=>1, 'min_compound'=>1],
                ['tag'=>'hinge',               'count'=>1, 'min_compound'=>1],
                ['tag'=>'lunge',               'count'=>1, 'min_compound'=>0],
                ['tag'=>'core_anti_extension', 'count'=>1, 'min_compound'=>0],
            ],
            'Full Body' => [
                ['tag'=>'squat',               'count'=>1, 'min_compound'=>1],
                ['tag'=>'horizontal_push',     'count'=>1, 'min_compound'=>1],
                ['tag'=>'horizontal_pull',     'count'=>1, 'min_compound'=>1],
                ['tag'=>'hinge',               'count'=>1, 'min_compound'=>1],
                ['tag'=>'core_anti_extension', 'count'=>1, 'min_compound'=>0],
            ],
            'Push' => [
                ['tag'=>'horizontal_push',     'count'=>2, 'min_compound'=>1],
                ['tag'=>'vertical_push',       'count'=>1, 'min_compound'=>0],
                ['tag'=>'core_anti_extension', 'count'=>1, 'min_compound'=>0],
            ],
            'Pull' => [
                ['tag'=>'horizontal_pull',     'count'=>2, 'min_compound'=>1],
                ['tag'=>'vertical_pull',       'count'=>1, 'min_compound'=>0],
                ['tag'=>'core_rotation',       'count'=>1, 'min_compound'=>0],
            ],
            'Legs' => [
                ['tag'=>'hinge',               'count'=>1, 'min_compound'=>1],
                ['tag'=>'squat',               'count'=>1, 'min_compound'=>1],
                ['tag'=>'lunge',               'count'=>1, 'min_compound'=>0],
                ['tag'=>'core_anti_extension', 'count'=>1, 'min_compound'=>0],
            ],
            'Cardio' => [
                ['tag'=>'cardio',        'count'=>3, 'min_compound'=>0],
            ],
            default => [
                ['tag'=>'horizontal_push',     'count'=>1, 'min_compound'=>1],
                ['tag'=>'horizontal_pull',     'count'=>1, 'min_compound'=>1],
                ['tag'=>'squat',               'count'=>1, 'min_compound'=>1],
                ['tag'=>'core_anti_extension', 'count'=>1, 'min_compound'=>0],
            ],
        };
    }
}