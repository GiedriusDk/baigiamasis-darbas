<?php

namespace App\Services\PlanGenerators;

final class CoreLast
{
    private const CORE_TAGS = [
        'abs','abdominals'
    ];

    public static function enforce(array $list): array
    {
        if (empty($list)) return $list;

        $warmup = [];
        $middle = [];
        $core = [];

        foreach ($list as $ex) {
            $tag = $ex['_meta_tag'] ?? '';
            if (($ex['_is_warmup'] ?? false) || $tag === 'warmup') {
                $warmup[] = $ex;
            } elseif (in_array($tag, self::CORE_TAGS, true)) {
                $core[] = $ex;
            } else {
                $middle[] = $ex;
            }
        }

        if (!empty($core)) {
            $last = end($core);
            $core = [$last];
        }

        return array_values(array_merge($warmup, $middle, $core));
    }
}