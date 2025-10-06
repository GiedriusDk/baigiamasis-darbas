<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            // pattern
            ['slug' => 'horizontal_push', 'label' => 'Horizontal push', 'group' => 'pattern'],
            ['slug' => 'vertical_push',   'label' => 'Vertical push',   'group' => 'pattern'],
            ['slug' => 'horizontal_pull', 'label' => 'Horizontal pull', 'group' => 'pattern'],
            ['slug' => 'vertical_pull',   'label' => 'Vertical pull',   'group' => 'pattern'],
            ['slug' => 'squat',           'label' => 'Squat',           'group' => 'pattern'],
            ['slug' => 'hinge',           'label' => 'Hinge',           'group' => 'pattern'],
            ['slug' => 'lunge',           'label' => 'Lunge',           'group' => 'pattern'],
            ['slug' => 'carry',           'label' => 'Carry',           'group' => 'pattern'],

            // core
            ['slug' => 'core_anti_extension', 'label' => 'Core – anti-extension', 'group' => 'core'],
            ['slug' => 'core_rotation',       'label' => 'Core – rotation',       'group' => 'core'],

            // meta
            ['slug' => 'conditioning', 'label' => 'Conditioning', 'group' => 'meta'],
            ['slug' => 'cardio',       'label' => 'Cardio',       'group' => 'meta'],
        ];

        DB::table('tags')->upsert($tags, ['slug'], ['label', 'group']);
    }
}