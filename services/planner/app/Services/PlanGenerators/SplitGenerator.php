<?php

namespace App\Services\PlanGenerators;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\CatalogService;

class SplitGenerator
{
    public function __construct(protected CatalogService $catalog) {}

    public function generate(
        string $goal,
        int $sessions,
        ?string $equipment = null,
        int $durationMin = 60,
        array $injuries = []
    ): array {
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
        $banned = $this->injuriesToBannedMuscles($injuries);

        $out = [];
        foreach ($days as $day) {
            $slots = DB::table('split_slots')
                ->where('split_day_id', $day->id)
                ->orderBy('id')
                ->get();

            $picked       = [];
            $slotPools    = [];
            $alreadyIds   = [];
            $alreadyNames = [];

            foreach ($slots as $slot) {
                $pool = $this->catalog->byTag($slot->tag, [
                    'equipment' => ($equipment === 'gym') ? null : $equipment,
                    'per_page'  => 120,
                ]);

                if (!$pool) continue;

                $pool = array_values(array_filter($pool, fn ($ex) => $this->isSafeForInjuries($ex, $banned)));
                if (!$pool) continue;

                $slotPools[$slot->tag] = $pool;
                shuffle($pool);

                $subset = [];
                foreach ($pool as $cand) {
                    if (count($subset) >= (int)$slot->count) break;
                    $id  = (string)($cand['id'] ?? '');
                    $nm  = Str::lower(trim((string)($cand['name'] ?? $cand['title'] ?? '')));
                    if ($id !== '' && isset($alreadyIds[$id])) continue;
                    if ($nm !== '' && isset($alreadyNames[$nm])) continue;
                    $subset[] = $cand;
                    if ($id !== '') $alreadyIds[$id] = true;
                    if ($nm !== '') $alreadyNames[$nm] = true;
                }

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

            $budget = max(10, $durationMin) * 60;
            $spent  = $this->totalSeconds($picked, $goal);

            if ($spent < $budget * 0.85 && !empty($slotPools)) {
                $picked = $this->topUpToBudget($picked, $slotPools, $goal, $durationMin, 8, 24, $banned);
            }

            $picked = $this->timebox($picked, $goal, $durationMin);

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
        $repSec = 6;
        $rest = (int)($ex['rest_sec'] ?? 60);
        $sets = max(1, (int)($ex['sets'] ?? 3));
        $minR = max(1, (int)($ex['rep_min'] ?? 8));
        $maxR = max($minR, (int)($ex['rep_max'] ?? 12));
        $avgReps = (int) floor(($minR + $maxR) / 2);
        $workPerSet = $avgReps * $repSec;
        $setTotal   = $workPerSet + $rest;
        return $sets * $setTotal;
    }

    protected function timebox(array $exList, string $goal, int $durationMin): array
    {
        $budget = max(10, $durationMin) * 60;
        $kept   = [];
        $spent  = 0;

        foreach ($exList as $i => $ex) {
            $need = $this->estimateExerciseSeconds($ex, $goal);
            if ($i > 0) $need += 20;
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
            if ($i > 0) $need += 20;
            $s += $need;
        }
        return $s;
    }

    protected function topUpToBudget(
        array $picked,
        array $slotPools,
        string $goal,
        int $durationMin,
        int $maxExtra,
        int $maxTotal,
        array $banned
    ): array {
        $budget = $durationMin * 60;
        $spent  = $this->totalSeconds($picked, $goal);
        if ($spent >= $budget) return $picked;

        $alreadyIds   = [];
        $alreadyNames = [];
        foreach ($picked as $ex) {
            $id = (string)($ex['id'] ?? '');
            $nm = Str::lower(trim((string)($ex['name'] ?? '')));
            if ($id !== '') $alreadyIds[$id] = true;
            if ($nm !== '') $alreadyNames[$nm] = true;
        }

        $maxPerTag = [
            'core_anti_extension' => 1,
        ];

        $counts = [];
        foreach ($picked as $ex) {
            $t = $ex['_meta_tag'] ?? '';
            $counts[$t] = ($counts[$t] ?? 0) + 1;
        }

        $tags  = array_keys($slotPools);
        $idx   = array_fill_keys($tags, 0);
        $added = 0;

        $loops = 0;
        while ($added < $maxExtra && count($picked) < $maxTotal && $spent < $budget && $loops < 100) {
            $loops++;
            foreach ($tags as $t) {
                if (isset($maxPerTag[$t]) && (($counts[$t] ?? 0) >= $maxPerTag[$t])) continue;

                $pool = $slotPools[$t] ?? [];
                if (!$pool) continue;

                $cand = $pool[$idx[$t] % count($pool)];
                $idx[$t]++;

                if (!$this->isSafeForInjuries($cand, $banned)) continue;

                $id = (string)($cand['id'] ?? '');
                $nm = Str::lower(trim((string)($cand['name'] ?? $cand['title'] ?? '')));
                if ($id !== '' && isset($alreadyIds[$id])) continue;
                if ($nm !== '' && isset($alreadyNames[$nm])) continue;

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
                $alreadyIds[$id] = true;
                if ($nm !== '') $alreadyNames[$nm] = true;
                $counts[$t] = ($counts[$t] ?? 0) + 1;
                $spent += $need;
                $added++;

                if ($added >= $maxExtra || count($picked) >= $maxTotal || $spent >= $budget) break;
            }
        }

        return $picked;
    }

    protected function injuriesToBannedMuscles(array $injuries): array
    {
        $map = [
            'Arms'       => ['biceps','triceps','forearms'],
            'Shoulders'  => ['shoulders','delts','front delts','rear delts','deltoids'],
            'Back'       => ['back','lats','upper back','lower back','traps','erectors'],
            'Chest'      => ['chest','pectorals','pecs'],
            'Abs'        => ['abs','core','obliques'],
            'Quads'      => ['quads'],
            'Hamstrings' => ['hamstrings'],
            'Glutes'     => ['glutes'],
            'Calves'     => ['calves'],
            'Neck'       => ['neck'],
            'Hips'       => ['hips','hip flexors'],
            'Knees'      => ['quads','hamstrings','glutes','calves'],
            'Elbows'     => ['biceps','triceps','forearms','elbows'],
            'Wrists'     => ['forearms','wrists'],
            'Ankles'     => ['calves','ankles'],
            'Legs'       => ['legs','quads','hamstrings','glutes','calves'],
        ];

        $mapLower = [];
        foreach ($map as $k => $vals) {
            $mapLower[Str::lower($k)] = array_map(fn($v) => Str::lower($v), $vals);
        }

        $banned = [];
        foreach ($injuries as $inj) {
            $inj = Str::lower((string)$inj);
            foreach ($mapLower[$inj] ?? [] as $m) {
                $banned[$m] = true;
            }
        }
        return $banned;
    }

    protected function isSafeForInjuries(array $ex, array $banned): bool
    {
        if (empty($banned)) return true;

        $fields = [
            'body_parts','target_muscles','secondary_muscles',
            'primary_muscle','primary_muscles','muscles','tags'
        ];

        $tokens = [];
        foreach ($fields as $k) {
            if (!array_key_exists($k, $ex) || $ex[$k] === null) continue;
            $v = $ex[$k];
            if (is_string($v)) {
                $vv = null;
                $tv = trim($v);
                if ($tv !== '' && $tv[0] === '[') $vv = json_decode($v, true);
                if (is_array($vv)) {
                    foreach ($vv as $p) $tokens[] = $p;
                } else {
                    foreach (explode(',', $v) as $p) $tokens[] = $p;
                }
            } elseif (is_array($v)) {
                foreach ($v as $p) $tokens[] = $p;
            }
        }

        $tokens = array_map(fn($s) => Str::lower(trim((string)$s)), $tokens);
        $tokens = array_filter($tokens);

        foreach ($tokens as $t) {
            if (isset($banned[$t])) return false;
        }

        $name = Str::lower(($ex['name'] ?? $ex['title'] ?? ''));
        if ($name !== '') {
            $shoulderRx = '/shoulder|deltoid|overhead\s+press|military\s+press|lateral\s+raise|front\s+raise|rear\s+delt/i';
            $backRx     = '/deadlift|good\s*morning|row\b|pull-?up|pulldown|back\s*extension|hyperextension/i';
            $legsRx     = '/squat|lunge|leg\s+press|leg\s+extension|leg\s+curl|calf\s+raise|step-?up|hip\s+thrust/i';

            if ((isset($banned['shoulders']) || isset($banned['delts']) || isset($banned['deltoids'])) && preg_match($shoulderRx, $name)) return false;
            if ((isset($banned['back']) || isset($banned['lats']) || isset($banned['upper back']) || isset($banned['lower back'])) && preg_match($backRx, $name)) return false;
            if ((isset($banned['legs']) || isset($banned['quads']) || isset($banned['hamstrings']) || isset($banned['glutes']) || isset($banned['calves'])) && preg_match($legsRx, $name)) return false;
        }

        return true;
    }
}