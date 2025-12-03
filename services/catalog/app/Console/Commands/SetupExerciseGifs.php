<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use ZipArchive;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use FilesystemIterator;

class SetupExerciseGifs extends Command
{
    protected $signature = 'exercises:setup-gifs 
                            {--force : Perkrauti ZIP dalis net jei jau yra lokaliai}';

    protected $description = 'Parsisiunčia GIF ZIP dalis iš GitHub (user-attachments), sujungia į vieną ZIP, išpakuoja ir pririša GIF prie pratimų.';

    public function handle()
    {
        
        $parts = [
            'https://github.com/user-attachments/files/23906508/gifs_part_aa.zip',
            'https://github.com/user-attachments/files/23906513/gifs_part_ab.zip',
            'https://github.com/user-attachments/files/23906522/gifs_part_ac.zip',
            'https://github.com/user-attachments/files/23906525/gifs_part_ad.zip',
            'https://github.com/user-attachments/files/23906531/gifs_part_ae.zip',
            'https://github.com/user-attachments/files/23906537/gifs_part_af.zip',
        ];

        if (empty($parts)) {
            $this->error('SetupExerciseGifs: $parts masyvas tuščias – įrašyk savo ZIP dalių URLus.');
            return self::FAILURE;
        }

        $tmpDir     = storage_path('app/tmp_gif_zips');
        $extractDir = storage_path('app/public/exercise_gifs');
        $fullZip    = $tmpDir . '/gifs_full.zip';

        $force = (bool) $this->option('force');

        
        if (!is_dir($tmpDir)) {
            mkdir($tmpDir, 0777, true);
        }
        if (!is_dir($extractDir)) {
            mkdir($extractDir, 0777, true);
        }

        $this->info("Atsisiųsime GIF ZIP dalis į: {$tmpDir}");

        
        $index = 0;
        foreach ($parts as $url) {
            $index++;

            $name = basename(parse_url($url, PHP_URL_PATH));
            if ($name === '' || $name === '/') {
                $name = "part_{$index}.zip";
            }

            $local = $tmpDir . '/' . $name;

            if (file_exists($local) && !$force) {
                $this->line("[SKIP] {$name} – jau yra lokaliai");
                continue;
            }

            $this->line("[DL]   {$name} iš {$url}");

            try {
                $res = Http::timeout(180)->get($url);
            } catch (\Throwable $e) {
                $this->error("Klaida jungiantis prie {$url}: " . $e->getMessage());
                return self::FAILURE;
            }

            if (!$res->ok()) {
                $this->error("HTTP klaida {$res->status()} bandant parsisiųsti {$url}");
                return self::FAILURE;
            }

            file_put_contents($local, $res->body());
            $this->line("      → išsaugota į {$local}");
        }

        
        $this->info("Sujungiame ZIP dalis į vieną failą: {$fullZip}");

        $out = fopen($fullZip, 'w');
        if (!$out) {
            $this->error("Nepavyko sukurti failo: {$fullZip}");
            return self::FAILURE;
        }

        $index = 0;
        foreach ($parts as $url) {
            $index++;

            $name = basename(parse_url($url, PHP_URL_PATH));
            if ($name === '' || $name === '/') {
                $name = "part_{$index}.zip";
            }

            $local = $tmpDir . '/' . $name;
            if (!file_exists($local)) {
                fclose($out);
                $this->error("Trūksta dalies: {$local}");
                return self::FAILURE;
            }

            $in = fopen($local, 'r');
            if (!$in) {
                fclose($out);
                $this->error("Nepavyko atidaryti dalies: {$local}");
                return self::FAILURE;
            }

            stream_copy_to_stream($in, $out);
            fclose($in);
        }

        fclose($out);

        
        $this->info("Išpakuojame GIF iš pilno ZIP: {$fullZip} → {$extractDir}");

        $zip = new ZipArchive();
        if ($zip->open($fullZip) !== true) {
            $this->error("Nepavyko atidaryti pilno ZIP: {$fullZip}");
            return self::FAILURE;
        }

        if (!$zip->extractTo($extractDir)) {
            $this->error("Nepavyko išpakuoti į: {$extractDir}");
            $zip->close();
            return self::FAILURE;
        }

        $zip->close();
        $this->info("GIF sėkmingai išpakuoti į: {$extractDir}");

        
        $this->cleanGifDir($extractDir);

        
        if (!file_exists(public_path('storage'))) {
            $this->info("Nėra public/storage symlink – paleidžiam storage:link");
            $this->call('storage:link');
        }

        
        $this->info("Pririšam GIF prie pratimų (atnaujinam image_url)...");
        $this->call('exercises:attach-gifs');

        $this->info("Viskas baigta ✔");

        $this->info("Šalinam laikiną katalogą: {$tmpDir}");
        $this->rrmdir($tmpDir);

        $this->info("Laikini ZIP failai išvalyti.");

        return self::SUCCESS;
    }

    private function cleanGifDir(string $baseDir): void
    {
        $this->info("Tvarkom GIF katalogą: {$baseDir}");

        
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($baseDir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($it as $file) {
            /** @var \SplFileInfo $file */
            if (!$file->isFile()) {
                continue;
            }

            $name = $file->getFilename();

            
            if (str_starts_with($name, '._')) {
                @unlink($file->getPathname());
                continue;
            }

            if (strtolower($file->getExtension()) !== 'gif') {
                continue;
            }

            $src = $file->getPathname();
            $dst = $baseDir . '/' . $name;

            if (realpath($src) === realpath($dst)) {
                continue; 
            }

            if (!file_exists($dst)) {
                rename($src, $dst);
            } else {
                
                @unlink($src);
            }
        }

        
        $it2 = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($baseDir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($it2 as $file) {
            if ($file->isDir()) {
                $dirName = $file->getFilename();
                $path    = $file->getPathname();

                if ($dirName === '__MACOSX') {
                    $this->line("Šalinam __MACOSX: {$path}");
                    $this->rrmdir($path);
                } else {
                    @rmdir($path); 
                }
            }
        }

        $this->info("GIF katalogas sutvarkytas – visi .gif dabar yra: {$baseDir}");
    }

    /**
     * Rekursyviai ištrina katalogą.
     */
    private function rrmdir(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($it as $file) {
            if ($file->isDir()) {
                @rmdir($file->getPathname());
            } else {
                @unlink($file->getPathname());
            }
        }

        @rmdir($dir);
    }
}