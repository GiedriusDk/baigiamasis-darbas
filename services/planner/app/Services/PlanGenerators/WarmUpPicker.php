<?php

namespace App\Services\PlanGenerators;

use App\Services\CatalogService;

final class WarmupPicker
{
    public static function pick(
        CatalogService $catalog,
        string $goal,
        string $dayName,
        ?string $equipment = null
    ): ?array {
        $cfg = GoalConfig::config($goal);

        if (mb_strtolower($dayName) === 'cardio' && !$cfg['warmup']['include_on_cardio_day']) {
            return null;
        }

        foreach ($cfg['warmup']['tags'] as $tag) {
            $pool = $catalog->byTag($tag, [
                'equipment' => ($equipment === 'gym') ? null : $equipment,
                'per_page'  => 60,
            ]);
            if (!empty($pool)) {
                shuffle($pool);
                $ex = $pool[0];
                return [
                    'id'        => $ex['id'] ?? null,
                    'name'      => 'Warm-up: ' . ($ex['name'] ?? ucfirst($tag)),
                    'sets'      => 1,
                    'rep_min'   => (int) $cfg['warmup']['sec_min'], // sekundės
                    'rep_max'   => (int) $cfg['warmup']['sec_max'],
                    'rest_sec'  => 30,
                    '_meta_tag' => 'warmup',
                ];
            }
        }
        return null;
    }
}