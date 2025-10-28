<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class ProfilesService {
    private string $base;
    private int $timeout;

    public function __construct() {
        $this->base = rtrim((string) config('services.profiles.base'), '/');
        $this->timeout = 10;
    }

    private function client(string $bearer) {
        return Http::baseUrl($this->base)
            ->timeout($this->timeout)
            ->acceptJson()
            ->withToken($bearer);
    }

    public function getProfile(string $bearer): array {
        $r = $this->client($bearer)->get('user/profile');
        if ($r->failed()) throw RequestException::create($r);
        return $r->json() ?? [];
    }

    public function updateProfile(array $payload, string $bearer): void {
        $r = $this->client($bearer)->put('user/profile', $payload);
        if ($r->failed()) throw RequestException::create($r);
    }
}