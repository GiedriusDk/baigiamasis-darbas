<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ChatPresenceSweep extends Command
{
    protected $signature = 'chat:presence-sweep';
    protected $description = 'Set users offline if last_seen_at is older than the presence TTL';

    public function handle(): int
    {
        $ttl = (int) (config('chat.presence_seconds') ?? env('CHAT_PRESENCE_SECONDS', 60));
        if ($ttl < 1) { $ttl = 60; }

        $affected = DB::update(
            "UPDATE chat_status
             SET is_online = FALSE
             WHERE is_online = TRUE
               AND last_seen_at < now() - (? || ' seconds')::interval",
            [$ttl]
        );

        $this->info("Updated {$affected} users to offline.");
        return self::SUCCESS;
    }
}