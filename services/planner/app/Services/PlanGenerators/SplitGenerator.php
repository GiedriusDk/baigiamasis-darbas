<?php

namespace App\Services\PlanGenerators;

use Illuminate\Support\Facades\DB;
use App\Services\CatalogService;

class SplitGenerator
{
    public function __construct(protected CatalogService $catalog) {}

    public function generate(string $goal, int $sessions, ?string $equipment = null, int $durationMin = 60): array
    {
        $split = DB::table('splits')
            ->where('goal', $goal)
            ->where('sessions_per_week', $sessions)
            ->first();

        if (!$split) return [];

        $days = DB::table('split_days')
            ->where('split_id', $split->id)
            ->orderBy('day_index')
            ->get();

        $scheme = GoalConfig::config($goal)['scheme'];

        $out = [];
        foreach ($days as $day) {
            $slots = DB::table('split_slots')
                ->where('split_day_id', $day->id)
                ->orderBy('id')
                ->get();

            $picked = [];
            $slotPools = [];

            if ($warm = WarmUpPicker::pick($this->catalog, $goal, $day->name, $equipment)) {
                $picked[] = $warm;
            }

            foreach ($slots as $slot) {
                $pool = $this->catalog->byTag($slot->tag, [
                    'equipment' => ($equipment === 'gym') ? null : $equipment,
                    'per_page'  => 100,
                ]);

                if ($pool) {
                    $slotPools[$slot->tag] = $pool;
                    shuffle($pool);
                    $subset = array_slice($pool, 0, (int) $slot->count);

                    foreach ($subset as $ex) {
                        $picked[] = [
                            'id'        => $ex['id'],
                            'name'      => $ex['name'] ?? 'Exercise',
                            'sets'      => $scheme['sets'],
                            'rep_min'   => $scheme['rep_min'],
                            'rep_max'   => $scheme['rep_max'],
                            'rest_sec'  => $scheme['rest'],
                            '_meta_tag' => $slot->tag,
                        ];
                    }
                }
            }

            $picked = CoreLast::enforce($picked);

            $budget = max(10, $durationMin) * 60;
            $spent  = $this->totalSeconds($picked, $goal);

            if ($spent < $budget * 0.85 && !empty($slotPools)) {
                $picked = $this->topUpToBudget($picked, $slotPools, $goal, $durationMin, maxExtra: 8, maxTotal: 18);
            }

            $picked = $this->timebox($picked, $goal, $day->name, $durationMin);

            $out[] = [
                'name'      => $day->name,
                'notes'     => null,
                'exercises' => array_values($picked),
            ];
        }

        return $out;
    }

    protected function estimateExerciseSeconds(array $ex, string $goal): int
    {
        if (($ex['_meta_tag'] ?? null) === 'warmup' || ($ex['_is_warmup'] ?? false)) {
            $sec = (int)($ex['rep_max'] ?? $ex['rep_min'] ?? 30);
            return max(20, min(300, $sec));
        }
        $repSec = 3;
        $rest = (int)($ex['rest_sec'] ?? 60);
        $sets = max(1, (int)($ex['sets'] ?? 3));
        $minR = max(1, (int)($ex['rep_min'] ?? 8));
        $maxR = max($minR, (int)($ex['rep_max'] ?? 12));
        $avgReps = (int) floor(($minR + $maxR) / 2);
        $workPerSet = $avgReps * $repSec;
        $setTotal   = $workPerSet + $rest;
        return $sets * $setTotal;
    }

    protected function timebox(array $exList, string $goal, string $dayName, int $durationMin): array
    {
        $budget = max(10, $durationMin) * 60;
        $kept   = [];
        $spent  = 0;

        foreach ($exList as $i => $ex) {
            $need = $this->estimateExerciseSeconds($ex, $goal);
            if ($i > 0 && ($ex['_meta_tag'] ?? '') !== 'warmup') {
                $need += 20;
            }
            if ($spent + $need > $budget) break;
            $kept[] = $ex;
            $spent += $need;
        }

        if (empty($kept) && !empty($exList)) {
            $kept = array_slice($exList, 0, min(3, count($exList)));
        }
        return $kept;
    }

    protected function totalSeconds(array $list, string $goal): int
    {
        $s = 0;
        foreach ($list as $i => $ex) {
            $need = $this->estimateExerciseSeconds($ex, $goal);
            if ($i > 0 && ($ex['_meta_tag'] ?? '') !== 'warmup') $need += 20;
            $s += $need;
        }
        return $s;
    }

    protected function topUpToBudget(
        array $picked,
        array $slotPools,
        string $goal,
        int $durationMin,
        int $maxExtra = 8,
        int $maxTotal = 18
    ): array {
        $budget = $durationMin * 60;
        $spent  = $this->totalSeconds($picked, $goal);
        if ($spent >= $budget) return $picked;

        $tags = array_keys($slotPools);
        $idx  = array_fill_keys($tags, 0);
        $added = 0;

        $isCoreTag = fn($t) => in_array($t, ['core_anti_extension','core_rotation','core']);

        $coreLast = null;
        if (!empty($picked)) {
            $last = end($picked);
            if ($isCoreTag($last['_meta_tag'] ?? '')) {
                array_pop($picked);
                $coreLast = $last;
                $spent = $this->totalSeconds($picked, $goal);
            }
        }

        $loops = 0;
        while ($added < $maxExtra && count($picked) < $maxTotal && $spent < $budget && $loops < 50) {
            $loops++;
            foreach ($tags as $t) {
                if ($isCoreTag($t)) continue;
                $pool = $slotPools[$t] ?? [];
                if (!$pool) continue;

                $i = $idx[$t] % count($pool);
                $cand = $pool[$i];
                $idx[$t]++;

                $ex = [
                    'id'        => $cand['id'],
                    'name'      => $cand['name'] ?? 'Exercise',
                    'sets'      => 3,
                    'rep_min'   => 8,
                    'rep_max'   => 12,
                    'rest_sec'  => 60,
                    '_meta_tag' => $t,
                ];

                $need = $this->estimateExerciseSeconds($ex, $goal) + 20;
                if ($spent + $need > $budget) continue;

                $picked[] = $ex;
                $spent += $need;
                $added++;

                if ($added >= $maxExtra || count($picked) >= $maxTotal || $spent >= $budget) break;
            }
        }

        if ($coreLast) $picked[] = $coreLast;

        return $picked;
    }
}