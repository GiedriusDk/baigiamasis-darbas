<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportExerciseDb extends Command
{
    protected $signature = 'import:exercisedb {--limit=0}';
    protected $description = 'Import exercises from local JSON files (database/exdb/*.json)';

    public function handle()
    {
        // <--- ČIA PAKEISTA VIETA
        $base = base_path('database/exdb');

        $exFile  = $base . '/exercises.json';
        $bpFile  = $base . '/bodyparts.json';
        $eqFile  = $base . '/equipments.json';
        $muFile  = $base . '/muscles.json';

        if (!file_exists($exFile)) {
            $this->error("Missing $exFile");
            return self::FAILURE;
        }

        // lookup lentelės (body_parts, equipments, muscles)
        $this->syncLookup($bpFile, 'body_parts');
        $this->syncLookup($eqFile, 'equipments');
        $this->syncLookup($muFile, 'muscles');

        $this->info('Reading exercises.json …');
        $data = json_decode(file_get_contents($exFile), true);

        if (!is_array($data)) {
            $this->error('Bad JSON in exercises.json');
            return self::FAILURE;
        }

        $limit = (int) $this->option('limit');
        $count = 0;
        $skipped = 0;
        $batch = [];
        $now   = now();

        foreach ($data as $r) {
            $name = trim((string)($r['name'] ?? ''));
            if ($name === '') {
                $skipped++;
                continue;
            }

            $targetMuscles    = $r['targetMuscles']    ?? [];
            $secondaryMuscles = $r['secondaryMuscles'] ?? [];
            $bodyParts        = $r['bodyParts']        ?? [];
            $equipments       = $r['equipments']       ?? [];
            $keywords         = $r['keywords']         ?? [];
            $instructions     = $r['instructions']     ?? [];

            $primary = $targetMuscles[0] ?? null;
            $equip   = $equipments[0]    ?? null;

            $batch[] = [
                'name'              => $name,
                'primary_muscle'    => $primary,
                'equipment'         => $equip,
                'image_url'         => $r['gifUrl'] ?? null,
                'source'            => 'exercisedb',
                'source_id'         => (string)($r['exerciseId'] ?? Str::uuid()->toString()),
                'tags'              => $keywords ? json_encode($keywords) : null,
                'body_parts'        => $bodyParts ? json_encode($bodyParts) : null,
                'target_muscles'    => $targetMuscles ? json_encode($targetMuscles) : null,
                'secondary_muscles' => $secondaryMuscles ? json_encode($secondaryMuscles) : null,
                'equipments_j'      => $equipments ? json_encode($equipments) : null,
                'instructions'      => $instructions ? json_encode($instructions) : null,
                'keywords'          => $keywords ? json_encode($keywords) : null,
                'created_at'        => $now,
                'updated_at'        => $now,
            ];

            $count++;
            if ($limit > 0 && $count >= $limit) {
                break;
            }

            if (count($batch) >= 500) {
                $this->flushExercises($batch);
                $batch = [];
                $this->line("Upserted {$count} (skipped {$skipped}) …");
            }
        }

        if ($batch) {
            $this->flushExercises($batch);
        }

        $this->info("Done. Imported/updated: {$count}, skipped: {$skipped}");
        return self::SUCCESS;
    }

    private function flushExercises(array $rows): void
    {
        DB::table('exercises')->upsert(
            $rows,
            ['source', 'source_id'],
            [
                'name',
                'primary_muscle',
                'equipment',
                'image_url',
                'tags',
                'body_parts',
                'target_muscles',
                'secondary_muscles',
                'equipments_j',
                'instructions',
                'keywords',
                'updated_at',
            ]
        );
    }

    private function syncLookup(?string $file, string $table): void
    {
        if (!$file || !file_exists($file)) {
            return;
        }

        $json = json_decode(file_get_contents($file), true);
        if (!is_array($json)) {
            return;
        }

        $rows = [];
        foreach ($json as $item) {
            if (is_string($item)) {
                $rows[] = ['name' => $item];
            } else {
                $name = $item['name'] ?? ($item['slug'] ?? null);
                if ($name) {
                    $rows[] = ['name' => $name];
                }
            }
        }

        if ($rows) {
            DB::table($table)->upsert($rows, ['name'], ['name']);
            $this->info("Synced " . count($rows) . " rows into {$table}");
        }
    }
}