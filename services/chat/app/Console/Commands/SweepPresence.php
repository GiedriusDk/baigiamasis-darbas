<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ChatStatus;

class SweepPresence extends Command
{
    protected $signature = 'chat:presence-sweep';
    protected $description = 'Set users offline if they have been inactive for too long';

    public function handle()
    {
        $cut = now()->subSeconds(config('chat.presence_timeout', 60));

        $count = ChatStatus::where('is_online', true)
            ->where(function ($q) use ($cut) {
                $q->whereNull('last_seen_at')
                  ->orWhere('last_seen_at', '<', $cut);
            })
            ->update(['is_online' => false]);

        $this->info("Updated {$count} users to offline.");
        return Command::SUCCESS;
    }
}