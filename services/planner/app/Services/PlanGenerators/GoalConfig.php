<?php

namespace App\Services\PlanGenerators;

final class GoalConfig
{
    public static function config(string $goal): array
    {
        $cfg = [
            'scheme' => [ 'sets' => 3, 'rep_min' => 8,  'rep_max' => 12, 'rest' => 60 ],
            'warmup' => [
                'tags' => ['cardio','core_anti_extension'],
                'sec_min' => 30,
                'sec_max' => 60,
                'include_on_cardio_day' => false,
            ],
        ];

        switch ($goal) {
            case 'muscle_gain':
                $cfg['scheme'] = [ 'sets' => 4, 'rep_min' => 6,  'rep_max' => 10, 'rest' => 90 ];
                $cfg['warmup']['tags'] = ['core_anti_extension','cardio'];
                $cfg['warmup']['sec_min'] = 20;
                $cfg['warmup']['sec_max'] = 40;
                break;

            case 'fat_loss':
                $cfg['scheme'] = [ 'sets' => 3, 'rep_min' => 12, 'rep_max' => 15, 'rest' => 45 ];
                $cfg['warmup']['tags'] = ['cardio','core_anti_extension'];
                $cfg['warmup']['sec_min'] = 40;
                $cfg['warmup']['sec_max'] = 60;
                break;

            case 'performance':
                $cfg['scheme'] = [ 'sets' => 5, 'rep_min' => 3,  'rep_max' => 6,  'rest' => 120 ];
                break;

            case 'general_fitness':
                // paliekam default‘us
                break;
        }

        return $cfg;
    }
}