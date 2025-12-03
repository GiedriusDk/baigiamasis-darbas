<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AttachLocalGifs extends Command
{
    protected $signature = 'exercises:attach-gifs 
                            {--dir= : Kelias iki GIF aplanko (default: storage/app/public/exercise_gifs)} 
                            {--dry-run : Tik parodyti statistiką, nieko nerašant į DB}';

    protected $description = 'Atnaujina exercises.image_url, kad rodytų į lokaliai saugomus GIF failus pagal source_id';

    public function handle()
    {
        
        $dirOpt = $this->option('dir');

        if ($dirOpt) {
            
            $baseDir = realpath($dirOpt) ?: $dirOpt;
        } else {
            $baseDir = storage_path('app/public/exercise_gifs');
        }

        if (!is_dir($baseDir)) {
            $this->error("GIF aplankas nerastas: {$baseDir}");
            return self::FAILURE;
        }

        $dry = (bool) $this->option('dry-run');

        $this->info("Naudosiu GIF aplanką: {$baseDir}");
        if ($dry) {
            $this->info("DRY RUN režimas – duomenų bazė NEBUS keičiama.");
        }

        $total   = 0;
        $withSrc = 0;
        $found   = 0;
        $updated = 0;
        $missing = 0;

        
        DB::table('exercises')
            ->orderBy('id')
            ->chunkById(500, function ($rows) use (
                $baseDir,
                $dry,
                &$total,
                &$withSrc,
                &$found,
                &$updated,
                &$missing
            ) {
                foreach ($rows as $row) {
                    $total++;

                    $sourceId = trim((string)($row->source_id ?? ''));
                    if ($sourceId === '') {
                        $missing++;
                        continue;
                    }

                    $withSrc++;

                    $filePath = $baseDir . '/' . $sourceId . '.gif';

                    if (!file_exists($filePath)) {
                        $missing++;
                        $this->line("[MISS] {$row->id} ({$sourceId}) – nerasau GIF faile");
                        continue;
                    }

                    $found++;

                    
                    $publicUrl = '/catalog/storage/exercise_gifs/' . $sourceId . '.gif';

                    if (!$dry) {
                        DB::table('exercises')
                            ->where('id', $row->id)
                            ->update(['image_url' => $publicUrl]);
                        $updated++;
                    }

                    $this->line("[OK]   {$row->id} ({$sourceId}) -> {$publicUrl}");
                }
            });

        
        $this->info('');
        $this->info('========== SANTRAUKA ==========');
        $this->info("Viso pratimų:               {$total}");
        $this->info("Su source_id:               {$withSrc}");
        $this->info("Rasta atitinkamų GIF failų: {$found}");
        $this->info("Atnaujinta DB įrašų:        {$updated}");
        $this->info("Be GIF / be source_id:      {$missing}");

        if ($dry) {
            $this->info("DRY RUN – DB nebuvo keista.");
        }

        return self::SUCCESS;
    }
}