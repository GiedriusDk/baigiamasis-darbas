<?php

namespace App\Services\PlanGenerators;

class CoreShuffler
{
    public static function shuffle(array $picked, string $goal): array
    {
        $cfg = GoalConfig::config($goal);
        if (!$cfg['core']['reposition'] || count($picked) < 2) return $picked;

        $isCore = function ($row) {
            $t = mb_strtolower($row['_meta_tag'] ?? '');
            if (in_array($t, ['core_anti_extension','core_rotation'])) return true;
            $n = mb_strtolower($row['name'] ?? '');
            return str_contains($n, 'plank') || str_contains($n, 'dead bug') || str_contains($n, 'rollout');
        };

        $last = count($picked) - 1;
        if ($isCore($picked[$last])) {
            $middle = (int) floor($last / 2);
            [$picked[$middle], $picked[$last]] = [$picked[$last], $picked[$middle]];
        }

        $chance = max(0, min(100, (int)$cfg['core']['random_chance']));
        if ($chance > 0) {
            $coreIdxs = [];
            foreach ($picked as $i => $row) if ($isCore($row)) $coreIdxs[] = $i;
            if ($coreIdxs && mt_rand(1,100) <= $chance) {
                $i = $coreIdxs[array_rand($coreIdxs)];
                $target = mt_rand(1, max(1, $last - 1));
                [$picked[$target], $picked[$i]] = [$picked[$i], $picked[$target]];
            }
        }

        return $picked;
    }
}