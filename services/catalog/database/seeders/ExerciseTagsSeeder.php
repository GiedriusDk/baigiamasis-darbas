<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExerciseTagsSeeder extends Seeder
{
    protected array $tagIdBySlug = [];

    public function run(): void
    {
        DB::transaction(function () {
            $this->ensureTags([
                'cardio'               => ['label' => 'Cardio',               'group' => 'meta'],
                'horizontal_push'      => ['label' => 'Horizontal push',      'group' => 'pattern'],
                'horizontal_pull'      => ['label' => 'Horizontal pull',      'group' => 'pattern'],
                'vertical_push'        => ['label' => 'Vertical push',        'group' => 'pattern'],
                'vertical_pull'        => ['label' => 'Vertical pull',        'group' => 'pattern'],
                'squat'                => ['label' => 'Squat',                'group' => 'pattern'],
                'hinge'                => ['label' => 'Hinge',                'group' => 'pattern'],
                'lunge'                => ['label' => 'Lunge',                'group' => 'pattern'],
                'carry'                => ['label' => 'Carry',                'group' => 'pattern'],
                'core_anti_extension'  => ['label' => 'Core – anti-extension','group' => 'core'],
                'core_rotation'        => ['label' => 'Core – rotation',      'group' => 'core'],
            ]);

            $this->tagIdBySlug = DB::table('tags')->pluck('id', 'slug')->all();

            // svarbu: nuvalome dublikatus prieš perseedinant
            DB::table('exercise_tag')->truncate();

            DB::table('exercises')->orderBy('id')->chunk(500, function ($rows) {
                $pivotInsert = [];

                foreach ($rows as $ex) {
                    $slug = $this->pickPrimaryTag($ex) ?? $this->fallbackByHeuristics($ex);
                    $tagId = $this->tagIdBySlug[$slug] ?? null;
                    if (!$tagId) continue;

                    $pivotInsert[] = ['exercise_id' => $ex->id, 'tag_id' => $tagId];

                    // į exercises.tags rašome SLUG, ne label (išvengiame \u2013)
                    DB::table('exercises')
                        ->where('id', $ex->id)
                        ->update([
                            'tags'       => json_encode([$slug]),
                            'updated_at' => now(),
                        ]);
                }

                if ($pivotInsert) {
                    DB::table('exercise_tag')->insert($pivotInsert);
                }
            });
        });
    }

    protected function ensureTags(array $defs): void
    {
        foreach ($defs as $slug => $meta) {
            DB::table('tags')->updateOrInsert(
                ['slug' => $slug],
                [
                    'label'      => $meta['label'] ?? ucfirst(str_replace('_',' ', $slug)),
                    'group'      => $meta['group'] ?? null,
                    'updated_at' => now(),
                    'created_at' => DB::raw("COALESCE(created_at, NOW())"),
                ]
            );
        }
    }

    protected function pickPrimaryTag(object $ex): ?string
    {
        $name  = mb_strtolower($ex->name ?? '');
        $pm    = mb_strtolower($ex->primary_muscle ?? '');
        $equip = mb_strtolower($ex->equipment ?? '');

        $bodyParts = $this->jsonToArr($ex->body_parts ?? null);
        $targets   = $this->jsonToArr($ex->target_muscles ?? null);

        if ($this->isPureCardio($bodyParts, $targets)) return 'cardio';

        if ($this->hasAny($name, ['squat','goblet squat','leg press'])) return 'squat';
        if ($this->hasAny($name, ['deadlift','rdl','romanian deadlift','good morning','hip hinge','hip thrust','glute bridge','kettlebell swing'])) return 'hinge';
        if ($this->hasAny($name, ['lunge','split squat','step-up','bulgarian'])) return 'lunge';
        if ($this->hasAny($name, ['farmer carry','suitcase carry','overhead carry','waiter carry','carry'])) return 'carry';

        if ($this->isVerticalPush($name))         return 'vertical_push';
        if ($this->isHorizontalPush($name, $pm))  return 'horizontal_push';
        if ($this->isVerticalPull($name))         return 'vertical_pull';
        if ($this->isHorizontalPull($name, $equip)) return 'horizontal_pull';

        if ($this->isAntiExtensionCore($name, $pm, $targets)) return 'core_anti_extension';
        if ($this->isRotationCore($name)) return 'core_rotation';

        // special: triceps izoliacijos (pushdown, triceps extension) – laikom kaip vertical_push
        if ($this->isTricepsIsolation($name, $pm)) return 'vertical_push';

        return null;
    }

    protected function isPureCardio(array $bodyParts, array $targets): bool
    {
        foreach ($bodyParts as $bp) {
            $s = mb_strtolower(is_array($bp) ? ($bp['name'] ?? $bp['label'] ?? '') : $bp);
            if ($s === 'cardio') return true;
        }
        foreach ($targets as $tm) {
            $s = mb_strtolower(is_array($tm) ? ($tm['name'] ?? $tm['label'] ?? '') : $tm);
            if ($s === 'cardiovascular system') return true;
        }
        return false;
    }

    protected function isVerticalPush(string $name): bool
    {
        return $this->hasAny($name, ['overhead press','shoulder press','military press','push press','strict press']);
    }

    protected function isHorizontalPush(string $name, string $pm): bool
    {
        if ($this->hasAny($name, ['bench press','push-up','push up','dips','dip','chest press','fly'])) return true;
        if ($this->hasAny($pm, ['chest']) && $this->hasAny($name, ['press','push'])) return true;
        return false;
    }

    protected function isVerticalPull(string $name): bool
    {
        return $this->hasAny($name, ['pull-up','pull up','chin-up','chin up','lat pulldown','pulldown']);
    }

    protected function isHorizontalPull(string $name, string $equip = ''): bool
    {
        if ($this->hasAny($equip, ['rower','erg'])) return false;
        if ($this->hasAny($name, ['rowing machine','rower'])) return false;
        return $this->hasAny($name, ['row']) && !$this->isVerticalPull($name);
    }

    protected function isTricepsIsolation(string $name, string $pm): bool
    {
        if ($this->hasAny($name, ['pushdown','triceps extension','skullcrusher','overhead extension'])) return true;
        return $this->hasAny($pm, ['triceps']) && $this->hasAny($name, ['extension','pushdown']);
    }

    protected function isAntiExtensionCore(string $name, string $pm, array $targets): bool
    {
        if ($this->hasAny($name, ['plank','ab wheel','rollout','dead bug','hollow'])) return true;
        if ($this->hasAny($pm, ['abs','core']) && $this->hasAny($name, ['plank','rollout'])) return true;

        $targetsStr = mb_strtolower(implode(' ', array_map(function ($t) {
            return is_array($t) ? ($t['name'] ?? $t['label'] ?? '') : $t;
        }, $targets)));

        return $this->hasAny($targetsStr, ['abs','core']) && $this->hasAny($name, ['plank','rollout']);
    }

    protected function isRotationCore(string $name): bool
    {
        return $this->hasAny($name, ['woodchop','pallof press','russian twist','landmine rotation','cable rotation']);
    }

    protected function fallbackByHeuristics(object $ex): string
    {
        $name = mb_strtolower($ex->name ?? '');
        $pm   = mb_strtolower($ex->primary_muscle ?? '');

        if ($this->hasAny($pm, ['quads','quadriceps'])) return 'squat';
        if ($this->hasAny($pm, ['glutes','hamstrings'])) return 'hinge';
        if ($this->hasAny($pm, ['abs','core']))          return 'core_anti_extension';
        if ($this->hasAny($pm, ['chest','shoulders']))   return 'horizontal_push';
        if ($this->hasAny($pm, ['back','lats','biceps']))return 'horizontal_pull';
        if ($this->isTricepsIsolation($name, $pm))       return 'vertical_push';

        if ($this->hasAny($name, ['press','push'])) return 'horizontal_push';
        if ($this->hasAny($name, ['row']))          return 'horizontal_pull';

        return 'horizontal_pull';
    }

    protected function jsonToArr($v): array
    {
        if (is_array($v)) return $v;
        if (is_string($v) && $v !== '') {
            $d = json_decode($v, true);
            return is_array($d) ? $d : [];
        }
        return [];
    }

    protected function hasAny(string $haystack, array $needles): bool
    {
        foreach ($needles as $n) {
            if ($n !== '' && mb_stripos($haystack, $n) !== false) return true;
        }
        return false;
    }
}