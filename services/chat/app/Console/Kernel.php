<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Console\Commands\ChatPresenceSweep;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command(ChatPresenceSweep::class)->everyMinute();
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
    }
}