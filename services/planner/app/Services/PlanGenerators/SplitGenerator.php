<?php

namespace App\Services\PlanGenerators;

use Illuminate\Support\Facades\DB;
use App\Services\CatalogService;

class SplitGenerator
{
    public function __construct(protected CatalogService $catalog) {}

    /**
     * $durationMin – planuojama sesijos trukmė minutėmis (30/45/60/75/90)
     */
    public function generate(string $goal, int $sessions, ?string $equipment = null, int $durationMin = 60): array
    {
        // 1) Iš DB – teisingas split
        $split = DB::table('splits')
            ->where('goal', $goal)
            ->where('sessions_per_week', $sessions)
            ->first();

        if (!$split) return [];

        // 2) Dienos
        $days = DB::table('split_days')
            ->where('split_id', $split->id)
            ->orderBy('day_index')
            ->get();

        // 3) Schemos pagal goal (sets/rep/rest)
        $scheme = GoalConfig::config($goal)['scheme']; // turi būti tavo GoalConfig

        $out = [];
        foreach ($days as $day) {
            // 3.1) Slot'ai
            $slots = DB::table('split_slots')
                ->where('split_day_id', $day->id)
                ->orderBy('id')
                ->get();

            $picked = [];

            // 3.2) Warm-up (jei randam)
            if ($warm = WarmupPicker::pick($this->catalog, $goal, $day->name, $equipment)) {
                $picked[] = $warm; // visada pirmas
            }

            // 3.3) Surenkam pratimų pagal slotus
            foreach ($slots as $slot) {
                $pool = $this->catalog->byTag($slot->tag, [
                    'equipment' => ($equipment === 'gym') ? null : $equipment,
                    'per_page'  => 100,
                ]);

                if (!$pool) continue;

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
                        '_meta_tag' => $slot->tag, // padeda atpažinti core
                    ];
                }
            }

            // 3.4) Core – visada paskutinis ir tik vienas
            $picked = CoreLast::enforce($picked);

            // 3.5) Timeboxing — pritaikom prie pageidaujamo laiko
            $picked = $this->timebox($picked, $goal, $day->name, $durationMin);

            // 3.6) Sudedam į dieną
            $out[] = [
                'name'      => $day->name,
                'notes'     => null,
                'exercises' => $picked,
            ];
        }

        return $out;
    }

    /**
     * Apytikslė vieno pratimo trukmė minutėmis
     * formulė: (setai * (pakartojimai * tempoSek/rep / 60)) + (poilsis tarp setų) + perėjimo laikas
     */
    protected function estimateExerciseMinutes(array $ex): float
    {
        // tempo: grubiai 3 sek per rep (2 žemyn + 1 aukštyn)
        $tempoSecPerRep = 3.0;
        $avgReps = max(1, ($ex['rep_min'] + $ex['rep_max']) / 2.0);

        $workPerSetMin = ($avgReps * $tempoSecPerRep) / 60.0;
        $sets = max(1, (int)($ex['sets'] ?? 3));
        $restSec = max(0, (int)($ex['rest_sec'] ?? 60));

        // Poilsio tarp setų būna (sets - 1) kartų
        $totalRestMin = (($sets - 1) * $restSec) / 60.0;

        // Perėjimo laikas tarp pratimų ~ 0.5 min
        $transitionMin = 0.5;

        return ($sets * $workPerSetMin) + $totalRestMin + $transitionMin;
    }

    /**
     * Warm-up pratimui skaičiuojam pagal jo laiką (rep_min/rep_max čia yra sekundės)
     */
    protected function estimateWarmupMinutes(array $ex): float
    {
        if (($ex['_meta_tag'] ?? '') !== 'warmup') {
            return $this->estimateExerciseMinutes($ex);
        }
        $sec = max((int)($ex['rep_min'] ?? 30),  (int)($ex['rep_max'] ?? 60));
        $transitionMin = 0.3;
        return ($sec / 60.0) + $transitionMin;
    }

    /**
     * Pritaiko apimtį prie $targetMin: pirmiausia mažina setus, tada kerpa accessory (ne compound, ne core, ne warmup).
     * Visada saugom:
     *  - [0] warm-up jei yra,
     *  - paskutinį core (CoreLast jau užtikrino gale),
     *  - bent 1 „pagrindinį“ (ne core, ne warmup) pratimą.
     */
    protected function timebox(array $exercises, string $goal, string $dayName, int $targetMin): array
    {
        if (!$exercises) return $exercises;

        // 1) pradinė trukmė
        $total = 0.0;
        foreach ($exercises as $i => $ex) {
            $total += $i === 0 ? $this->estimateWarmupMinutes($ex) : $this->estimateExerciseMinutes($ex);
        }
        if ($total <= $targetMin) return $exercises;

        // Padės atskirti role
        $isWarmup = fn($row, $idx) => $idx === 0 && (($row['_meta_tag'] ?? '') === 'warmup');
        $isCore   = fn($row, $idx) => (($row['_meta_tag'] ?? '') === 'core_anti_extension' || ($row['_meta_tag'] ?? '') === 'core_rotation');

        // 2) mažinam setus pradedant nuo vidurio, saugant warmup(0) ir core (paskutinis)
        $last = count($exercises) - 1;
        $idxs = range(1, max(1, $last - 1)); // tarp pirmo ir paskutinio
        // truputį random, kad ne visada tas pats dingtų
        shuffle($idxs);

        foreach ($idxs as $i) {
            if ($total <= $targetMin) break;

            // skip core
            if ($isCore($exercises[$i], $i)) continue;

            // mažinam setus iki 2 minimum
            if (($exercises[$i]['sets'] ?? 3) > 2) {
                $exercises[$i]['sets'] = (int)$exercises[$i]['sets'] - 1;
                $total = 0.0;
                foreach ($exercises as $k => $row) {
                    $total += $k === 0 ? $this->estimateWarmupMinutes($row) : $this->estimateExerciseMinutes($row);
                }
            }
        }
        if ($total <= $targetMin) return $exercises;

        // 3) jei vis dar per ilga — trumpinam poilsį, bet ne mažiau 30s
        foreach ($idxs as $i) {
            if ($total <= $targetMin) break;
            if ($isCore($exercises[$i], $i)) continue;
            $rest = max(30, (int)($exercises[$i]['rest_sec'] ?? 60) - 15);
            if ($rest < ($exercises[$i]['rest_sec'] ?? 60)) {
                $exercises[$i]['rest_sec'] = $rest;
                $total = 0.0;
                foreach ($exercises as $k => $row) {
                    $total += $k === 0 ? $this->estimateWarmupMinutes($row) : $this->estimateExerciseMinutes($row);
                }
            }
        }
        if ($total <= $targetMin) return $exercises;

        // 4) jei vis dar — pradedam kirpti „mažiausiai svarbius“:
        //    pirmiausia ne core, ne warm-up, ne pirmą compound (toje dienoje). Paprastumo dėlei – pjaunam nuo priešpaskutinio atgal.
        for ($i = $last - 1; $i >= 1 && $total > $targetMin && count($exercises) > 3; $i--) {
            if ($isWarmup($exercises[$i], $i) || $isCore($exercises[$i], $i)) continue;
            // remove
            $cut = $exercises[$i];
            array_splice($exercises, $i, 1);

            // iš naujo perskaičiuojam
            $total = 0.0;
            foreach ($exercises as $k => $row) {
                $total += $k === 0 ? $this->estimateWarmupMinutes($row) : $this->estimateExerciseMinutes($row);
            }
        }

        return $exercises;
    }
}