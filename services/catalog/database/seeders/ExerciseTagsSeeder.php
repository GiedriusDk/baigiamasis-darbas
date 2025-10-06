<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ExerciseTagsSeeder extends Seeder
{
    /** slug => id */
    protected array $tagIdBySlug = [];

    public function run(): void
    {
        // Užtikrinam, kad turim visus reikalingus tagus
        $this->ensureTags([
            // meta
            'cardio'               => ['label' => 'Cardio',              'group' => 'meta'],

            // patterns
            'horizontal_push'      => ['label' => 'Horizontal push',     'group' => 'pattern'],
            'horizontal_pull'      => ['label' => 'Horizontal pull',     'group' => 'pattern'],
            'vertical_push'        => ['label' => 'Vertical push',       'group' => 'pattern'],
            'vertical_pull'        => ['label' => 'Vertical pull',       'group' => 'pattern'],
            'squat'                => ['label' => 'Squat',               'group' => 'pattern'],
            'hinge'                => ['label' => 'Hinge',               'group' => 'pattern'],
            'lunge'                => ['label' => 'Lunge',               'group' => 'pattern'],
            'carry'                => ['label' => 'Carry',               'group' => 'pattern'],

            // core
            'core_anti_extension'  => ['label' => 'Core – anti-extension','group' => 'core'],
            'core_rotation'        => ['label' => 'Core – rotation',     'group' => 'core'],
        ]);

        $this->tagIdBySlug = DB::table('tags')->pluck('id', 'slug')->all();

        // Eisim porcijomis
        DB::table('exercises')->orderBy('id')->chunk(500, function ($rows) {
            foreach ($rows as $ex) {
                $slug = $this->pickPrimaryTag($ex);
                if (!$slug) {
                    // Paskutinis saugiklis – nededam „conditioning“, nes jo atsisakom.
                    // Renkam labiausiai tikėtiną pagal raumenį / pavadinimą.
                    $slug = $this->fallbackByHeuristics($ex);
                }

                $tagId = $this->tagIdBySlug[$slug] ?? null;
                if ($tagId) {
                    DB::table('exercise_tag')->updateOrInsert(
                        ['exercise_id' => $ex->id, 'tag_id' => $tagId],
                        []
                    );
                }
            }
        });
    }

    /** Užtikrinam, kad tags lentelėje būtų įrašai. */
    protected function ensureTags(array $defs): void
    {
        foreach ($defs as $slug => $meta) {
            $exists = DB::table('tags')->where('slug', $slug)->exists();
            if (!$exists) {
                DB::table('tags')->insert([
                    'slug'       => $slug,
                    'label'      => $meta['label'] ?? ucfirst(str_replace('_',' ', $slug)),
                    'group'      => $meta['group'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /** Pagrindinė logika – be „conditioning“, su griežtu cardio. */
    protected function pickPrimaryTag(object $ex): ?string
    {
        $name    = mb_strtolower($ex->name ?? '');
        $pm      = mb_strtolower($ex->primary_muscle ?? '');
        $equip   = mb_strtolower($ex->equipment ?? '');

        $bodyParts = $this->jsonToArr($ex->body_parts ?? null);
        $targets   = $this->jsonToArr($ex->target_muscles ?? null);

        // 1) Tikras kardio
        if ($this->isPureCardio($bodyParts, $targets)) {
            return 'cardio';
        }

        // 2) Apatinės kūno dalies pagrindiniai pattern’ai
        if ($this->hasAny($name, ['squat','front squat','back squat','goblet squat','hack squat','leg press'])) {
            return 'squat';
        }
        if ($this->hasAny($name, ['deadlift','rdl','romanian deadlift','good morning','hip hinge','hip thrust','glute bridge','kettlebell swing'])) {
            return 'hinge';
        }
        if ($this->hasAny($name, ['lunge','split squat','walking lunge','step-up','step up','bulgarian'])) {
            return 'lunge';
        }
        if ($this->hasAny($name, ['farmer carry','suitcase carry','overhead carry','waiter carry','carry'])) {
            return 'carry';
        }

        // 3) Viršutinė – push/pull (vertik./horiz.)
        if ($this->isVerticalPush($name, $pm))   return 'vertical_push';
        if ($this->isHorizontalPush($name, $pm)) return 'horizontal_push';
        if ($this->isVerticalPull($name))        return 'vertical_pull';
        if ($this->isHorizontalPull($name, $equip)) return 'horizontal_pull';

        // 4) Core
        if ($this->isAntiExtensionCore($name, $pm, $targets)) return 'core_anti_extension';
        if ($this->isRotationCore($name))                    return 'core_rotation';

        // 5) Heuristika pagal primary_muscle
        return $this->fallbackByHeuristics($ex);
    }

    /** Tikras „cardio“: body_parts turi "cardio" ARBA target_muscles turi "cardiovascular system". */
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

    protected function isVerticalPush(string $name, string $pm): bool
    {
        if ($this->hasAny($name, ['overhead press','shoulder press','military press','push press','strict press'])) return true;
        return false;
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

    protected function isAntiExtensionCore(string $name, string $pm, array $targets): bool
    {
        if ($this->hasAny($name, ['plank','ab wheel','rollout','dead bug','hollow'])) return true;
        if ($this->hasAny($pm, ['abs','core']) && $this->hasAny($name, ['plank','rollout'])) return true;

        $targetsStr = mb_strtolower(implode(' ', array_map(function ($t) {
            return is_array($t) ? ($t['name'] ?? $t['label'] ?? '') : $t;
        }, $targets)));

        if ($this->hasAny($targetsStr, ['abs','core']) && $this->hasAny($name, ['plank','rollout'])) return true;

        return false;
    }

    protected function isRotationCore(string $name): bool
    {
        return $this->hasAny($name, ['woodchop','pallof press','russian twist','landmine rotation','cable rotation']);
    }

    /** Jei dar nieko nepagavom – heuristika. */
    protected function fallbackByHeuristics(object $ex): string
    {
        $name = mb_strtolower($ex->name ?? '');
        $pm   = mb_strtolower($ex->primary_muscle ?? '');

        if ($this->hasAny($pm, ['quads','quadriceps'])) return 'squat';
        if ($this->hasAny($pm, ['glutes','hamstrings'])) return 'hinge';
        if ($this->hasAny($pm, ['abs','core']))          return 'core_anti_extension';
        if ($this->hasAny($pm, ['chest','shoulders','triceps'])) return 'horizontal_push';
        if ($this->hasAny($pm, ['back','lats','biceps']))        return 'horizontal_pull';

        // pagal pavadinimą
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