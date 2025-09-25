<?php

namespace App\Services\PlanGenerators;

use Illuminate\Support\Facades\DB;
use App\Services\CatalogService;

class SplitGenerator
{
    public function __construct(private CatalogService $catalog) {}

    // paprasta equipment politika; prireikus praplėsi
    private array $equipmentPolicy = [
        'gym'       => ['*'],                          // be filtro
        'dumbbell'  => ['dumbbell','body weight','kettlebell'],
        'barbell'   => ['barbell','body weight'],
        'cable'     => ['cable','body weight','machine'],
        'body weight' => ['body weight','band'],
        'kettlebell'  => ['kettlebell','body weight','dumbbell'],
    ];

    public function generate(string $goal, int $sessions, ?string $equipment = null): array
    {
        $split = DB::table('splits')
            ->where('goal', $goal)
            ->where('sessions_per_week', $sessions)
            ->first();

        if (!$split) {
            return []; // PlanController pasidarys fallback į PPL ar grąžins 422
        }

        $days = DB::table('split_days')
            ->where('split_id', $split->id)
            ->orderBy('day_index')
            ->get();

        $slots = DB::table('split_slots')
            ->whereIn('split_day_id', $days->pluck('id'))
            ->orderBy('id')
            ->get()
            ->groupBy('split_day_id');

        // susidėliojam leidžiamą įrangą
        $allowedEquip = $this->allowedEquipments($equipment);

        $template = [];
        foreach ($days as $d) {
            $daySlots = $slots->get($d->id, collect());
            $pickedIds = []; // kad tą pačią dieną nesidubliuotų pratimai

            $exList = [];
            foreach ($daySlots as $slot) {
                // pasiimam iš katalogo pagal tag'ą ir įrangą
                $pool = $this->searchByTag($slot->tag, $allowedEquip);

                // jei reikalaujama bent 1 „compound“ – bandome tokių paiešką
                if ((int)$slot->min_compound > 0) {
                    $compound = $this->filterCompound($pool);
                    if (!empty($compound)) {
                        $pool = $compound + $pool; // compound prioritetas
                    }
                }

                // iš pool'o paimam tiek įrašų, kiek nurodo count
                $need = max(1, (int) $slot->count);
                $chosen = $this->pickUnique($pool, $pickedIds, $need);

                foreach ($chosen as $row) {
                    $pickedIds[] = $row['id'];

                    // baziniai set/rep (gali diferencijuoti pagal goal ar tag vėliau)
                    $exList[] = [
                        'id'       => (int) $row['id'],
                        'sets'     => 3,
                        'rep_min'  => 8,
                        'rep_max'  => 12,
                        'rest_sec' => 75,
                    ];
                }
            }

            $template[] = [
                'name'      => $d->name,
                'notes'     => null,
                'exercises' => $exList,
            ];
        }

        return $template;
    }

    private function allowedEquipments(?string $equipment): array
    {
        $equipment = $equipment ? strtolower($equipment) : 'gym';
        return $this->equipmentPolicy[$equipment] ?? ['*'];
    }

    /**
     * Iškviečia katalogą pagal tag'ą ir (jei ne '*') – leistinus equipment.
     * Grąžina masyvą: [ ['id'=>..,'name'=>..,'image_url'=>..,'equipment'=>..], ... ]
     */
    private function searchByTag(string $tag, array $allowedEquip): array
    {
        // jei pilnas „gym“ – tag pakanka
        if (in_array('*', $allowedEquip, true)) {
            return $this->catalog->exercises(['tag' => $tag, 'per_page' => 80]);
        }

        // kitaip – leistinus įrenginius kviečiam po kelis
        $all = [];
        foreach ($allowedEquip as $eq) {
            $batch = $this->catalog->exercises([
                'tag'       => $tag,
                'equipment' => $eq,
                'per_page'  => 80,
            ]);
            foreach ($batch as $row) {
                $all[$row['id']] = $row; // uniq by id
            }
        }
        return array_values($all);
    }

    /**
     * Labai paprastas „compound“ heuristikas (pasitobulinsi vėliau).
     */
    private function filterCompound(array $pool): array
    {
        $re = '/(squat|deadlift|row|bench|press|pull[- ]?up|dip)/i';
        $out = [];
        foreach ($pool as $row) {
            if (!empty($row['name']) && preg_match($re, $row['name'])) {
                $out[$row['id']] = $row;
            }
        }
        return $out;
    }

    /**
     * Paimam n unikalių įrašų iš pool'o (pagal id), vengiant dubliavimosi toje pačioje dienoje.
     */
    private function pickUnique(array $pool, array $already, int $need): array
    {
        if ($need <= 0 || empty($pool)) return [];

        // mažas shuffle, kad planai nesigimtų identiški
        shuffle($pool);

        $picked = [];
        foreach ($pool as $row) {
            if (in_array($row['id'], $already, true)) continue;
            $picked[] = $row;
            if (count($picked) >= $need) break;
        }
        return $picked;
    }
}