<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class PaymentsService
{
    protected string $base;

    public function __construct()
    {
        $this->base = rtrim(
            config('services.payments.base', env('PAYMENTS_BASE', 'http://gateway/api/payments')),
            '/'
        );
    }

    public function userHasAccessToCoach(int $userId, int $coachId, ?string $bearer = null): bool
    {
        try {
            $http = Http::acceptJson();
            if ($bearer) {
                $http = $http->withToken($bearer);
            }

            $res = $http->get($this->base . '/internal/can-chat', [
                'user_id'  => $userId,
                'coach_id' => $coachId,
            ]);

            if ($res->ok()) {
                $j = $res->json();
                return (bool)($j['ok'] ?? $j['can_chat'] ?? $j['has_access'] ?? false);
            }
        } catch (\Throwable $e) {
            report($e);
        }

        return false;
    }
}