<?php

namespace App\Services\PlanGenerators;

final class CoreLast
{
    public static function isCore(array $row): bool
    {
        $t = mb_strtolower($row['_meta_tag'] ?? '');
        if (in_array($t, ['core_anti_extension','core_rotation'], true)) return true;

        $n = mb_strtolower($row['name'] ?? '');
        return str_contains($n, 'plank') || str_contains($n, 'dead bug') || str_contains($n, 'rollout');
    }

    public static function enforce(array $picked): array
    {
        if (count($picked) < 2) return $picked;

        $core = null;
        $others = [];

        foreach ($picked as $row) {
            if (self::isCore($row)) {
                if ($core === null) $core = $row;
            } else {
                $others[] = $row;
            }
        }

        if ($core !== null) {
            $others[] = $core; // core į galą
        }

        return $others;
    }
}