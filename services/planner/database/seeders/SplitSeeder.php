<?php

namespace Database\Seeders;

use App\Models\Split;
use App\Models\SplitDay;
use App\Models\SplitSlot;
use Illuminate\Database\Seeder;

class SplitSeeder extends Seeder
{
    public function run(): void
    {
        // muscle_gain + 3 (PPL)
        $split = Split::updateOrCreate(
            ['goal' => 'muscle_gain', 'sessions_per_week' => 3],
            ['slug' => 'muscle_gain_3_ppl', 'meta' => null]
        );

        $this->seedDays($split, [
            ['name' => 'Push', 'slots' => [
                ['tag' => 'horizontal_push', 'count' => 2, 'min_compound' => 1],
                ['tag' => 'vertical_push',   'count' => 1, 'min_compound' => 0],
                ['tag' => 'core_anti_extension', 'count' => 1, 'min_compound' => 0],
            ]],
            ['name' => 'Pull', 'slots' => [
                ['tag' => 'horizontal_pull', 'count' => 2, 'min_compound' => 1],
                ['tag' => 'vertical_pull',   'count' => 1, 'min_compound' => 0],
                ['tag' => 'core_rotation',   'count' => 1, 'min_compound' => 0],
            ]],
            ['name' => 'Legs', 'slots' => [
                ['tag' => 'hinge', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'squat', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'lunge', 'count' => 1, 'min_compound' => 0],
                ['tag' => 'core_anti_extension', 'count' => 1, 'min_compound' => 0],
            ]],
        ]);

        // general_fitness + 4 (ULUL)
        $split = Split::updateOrCreate(
            ['goal' => 'general_fitness', 'sessions_per_week' => 4],
            ['slug' => 'general_fitness_4_ulul', 'meta' => null]
        );

        $this->seedDays($split, [
            ['name' => 'Upper', 'slots' => [
                ['tag' => 'horizontal_push', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'vertical_pull',   'count' => 1, 'min_compound' => 1],
                ['tag' => 'accessory_upper', 'count' => 2, 'min_compound' => 0],
                ['tag' => 'core_anti_extension', 'count' => 1, 'min_compound' => 0],
            ]],
            ['name' => 'Lower', 'slots' => [
                ['tag' => 'squat', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'hinge', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'lunge', 'count' => 1, 'min_compound' => 0],
                ['tag' => 'core_rotation', 'count' => 1, 'min_compound' => 0],
            ]],
            ['name' => 'Upper', 'slots' => [
                ['tag' => 'horizontal_pull', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'vertical_push',   'count' => 1, 'min_compound' => 1],
                ['tag' => 'accessory_upper', 'count' => 2, 'min_compound' => 0],
                ['tag' => 'core_lateral', 'count' => 1, 'min_compound' => 0],
            ]],
            ['name' => 'Lower', 'slots' => [
                ['tag' => 'squat', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'hinge', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'conditioning', 'count' => 1, 'min_compound' => 0],
                ['tag' => 'core_anti_extension', 'count' => 1, 'min_compound' => 0],
            ]],
        ]);

        // fat_loss + 3 (FullBody + FullBody + Cardio)
        $split = Split::updateOrCreate(
            ['goal' => 'fat_loss', 'sessions_per_week' => 3],
            ['slug' => 'fat_loss_3_fbfbc', 'meta' => null]
        );

        $this->seedDays($split, [
            ['name' => 'Full Body', 'slots' => [
                ['tag' => 'squat', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'horizontal_push', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'horizontal_pull', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'core_anti_extension', 'count' => 1, 'min_compound' => 0],
            ]],
            ['name' => 'Full Body', 'slots' => [
                ['tag' => 'hinge', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'vertical_push', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'vertical_pull', 'count' => 1, 'min_compound' => 1],
                ['tag' => 'core_rotation', 'count' => 1, 'min_compound' => 0],
            ]],
            ['name' => 'Cardio', 'slots' => [
                ['tag' => 'conditioning', 'count' => 1, 'min_compound' => 0],
                ['tag' => 'core_lateral', 'count' => 1, 'min_compound' => 0],
            ]],
        ]);
    }

    private function seedDays(Split $split, array $days): void
    {
        foreach ($days as $idx => $d) {
            $day = \App\Models\SplitDay::updateOrCreate(
                ['split_id' => $split->id, 'day_index' => $idx],
                ['name' => $d['name']]
            );

            foreach ($d['slots'] as $s) {
                SplitSlot::updateOrCreate(
                    ['split_day_id' => $day->id, 'tag' => $s['tag']],
                    ['count' => $s['count'], 'min_compound' => $s['min_compound']]
                );
            }
        }
    }
}