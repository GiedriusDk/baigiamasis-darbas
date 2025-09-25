<?php

namespace App\Services\PlanGenerators;

use App\Services\CatalogService;

class PplGenerator
{
    public function __construct(private CatalogService $catalog) {}

    /**
     * $equipment gali būti:
     *  - konkretus pavadinimas (pvz. "dumbbell", "barbell", "body weight", …)
     *  - null (tada įranga nefiltruojama – imi visus pratimus pagal raumenų grupes)
     */
    public function generate(int $days = 3, string $goal = 'muscle_gain', ?string $equipment = null): array
    {
        // PPL dienų raumenų grupės
        $dayMuscles = [
            ['chest','shoulders','triceps'],                // Push
            ['back','biceps'],                              // Pull
            ['quads','hamstrings','glutes','calves'],       // Legs
        ];

        $names    = ['Push','Pull','Legs'];
        $template = [];

        for ($i = 0; $i < $days; $i++) {
            $muscles = $dayMuscles[$i] ?? $dayMuscles[0];

            // Kandidatus imame iš CatalogService
            $params = [
                'muscles'  => implode(',', $muscles),
                'per_page' => 60,
                'page'     => 1,
            ];
            if ($equipment !== null && $equipment !== '') {
                $params['equipment'] = $equipment;
            }

            $pool   = $this->catalog->exercises($params);
            $picked = $this->pickForDay($pool, $muscles, $goal);

            $template[] = [
                'name'      => $names[$i] ?? ('Day '.($i + 1)),
                'notes'     => null,
                'exercises' => $picked,
            ];
        }

        return $template;
    }

    /**
     * Labai paprastas heuritistinis parinkimas:
     * - iki 2 "compound" (5–8 rep, 3–4 set)
     * - likę "accessory" (10–12 rep, 3 set)
     */
    protected function pickForDay(array $pool, array $muscles, string $goal): array
    {
        $compoundKeys = [
            'press','row','squat','deadlift','pull-up','pull up','dip','lunge','ohp','bench','hip thrust'
        ];

        $isCompound = function (string $name) use ($compoundKeys): bool {
            $n = mb_strtolower($name);
            foreach ($compoundKeys as $k) {
                if (str_contains($n, $k)) {
                    return true;
                }
            }
            return false;
        };

        $comp = [];
        $acc  = [];
        foreach ($pool as $ex) {
            $name = (string) ($ex['name'] ?? '');
            if ($name !== '' && $isCompound($name)) {
                $comp[] = $ex;
            } else {
                $acc[] = $ex;
            }
        }

        $targetTotal = 6;
        $targetComp  = min(2, max(1, count($comp) ? 2 : 1));

        $picked = [];

        // Compound – 3–4 × 5–8, ~120s poilsis
        shuffle($comp);
        for ($i = 0; $i < $targetComp && $i < count($comp); $i++) {
            $picked[] = $this->formatExercise($comp[$i], sets: rand(3,4), repMin: 5, repMax: 8, rest: 120);
        }

        // Accessory – 3 × 10–12, ~75s poilsis
        shuffle($acc);
        while (count($picked) < $targetTotal && count($acc) > 0) {
            $picked[] = $this->formatExercise(array_pop($acc), sets: 3, repMin: 10, repMax: 12, rest: 75);
        }

        return $picked;
    }

    protected function formatExercise(array $ex, int $sets, int $repMin, int $repMax, int $rest): array
    {
        return [
            'id'        => $ex['id'] ?? null,
            'name'      => $ex['name'] ?? 'Exercise',
            'body_part' => $ex['primary_muscle'] ?? null,
            'equipment' => $ex['equipment'] ?? null,
            'sets'      => $sets,
            'rep_min'   => $repMin,
            'rep_max'   => $repMax,
            'rest_sec'  => $rest,
        ];
    }
}