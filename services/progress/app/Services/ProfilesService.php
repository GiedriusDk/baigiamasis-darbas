<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\RequestException;

class ProfilesService
{
    private string $base;
    private int $timeout;

    public function __construct()
    {
        $this->base = rtrim((string) config('services.profiles.base'), '/');
        $this->timeout = 10;
    }

    private function client(string $bearer)
    {
        return Http::baseUrl($this->base)
            ->timeout($this->timeout)
            ->acceptJson()
            ->withToken($bearer);
    }

    public function getProfile(string $bearer): array
    {
        $r = $this->client($bearer)->get('user/profile');
        if ($r->failed()) throw RequestException::create($r);
        return $r->json() ?? [];
    }

    public function updateProfile(array $payload, string $bearer): void
    {
        $r = $this->client($bearer)->put('user/profile', $payload);
        if ($r->failed()) throw RequestException::create($r);
    }

    public function getProgressDefaults(string $bearer): array
    {
        $r = $this->client($bearer)->get('user/progress-defaults');
        if ($r->failed()) throw RequestException::create($r);
        return $r->json('data') ?? [];
    }

    public function setProgressDefaults(array $payload, string $bearer): array
    {
        $r = $this->client($bearer)->put('user/progress-defaults', $payload);
        if ($r->failed()) throw RequestException::create($r);
        return $r->json('saved') ?? [];
    }

    public function getPublicProfile(int $userId): array
    {
        $r = Http::baseUrl($this->base)
            ->timeout($this->timeout)
            ->acceptJson()
            ->get("user/public/{$userId}");

        if ($r->failed()) throw RequestException::create($r);
        return $r->json('data') ?? [];
    }
}