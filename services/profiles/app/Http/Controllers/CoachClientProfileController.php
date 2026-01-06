<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\UserProfile;

class CoachClientProfileController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        return (int) ($u['id'] ?? 0);
    }

    public function show(Request $r, int $userId)
    {
        $coachId = $this->me($r);
        if (!$coachId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        $chatBase = rtrim(config('services.chat.base'), '/');

        $resp = Http::acceptJson()
            ->withToken((string) $r->bearerToken())
            ->get("{$chatBase}/coach/clients/{$userId}");

        if (!$resp->ok() || !$resp->json('ok')) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $profile = UserProfile::where('user_id', $userId)->first();

        if (!$profile) {
            return response()->json(['message' => 'Not found'], 404);
        }

        return response()->json($profile);
    }
}