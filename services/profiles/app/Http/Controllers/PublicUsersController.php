<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use App\Models\UserProfile;

class PublicUsersController extends Controller
{
    private function fileUrl(?string $path, ?string $fallback = null): ?string
    {
        if (!$path) return $fallback;

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        $p = parse_url($path, PHP_URL_PATH) ?: $path;
        $p = ltrim($p, '/');

        $p = preg_replace('#^(profiles/)?storage/public/#i', '', $p);
        $p = preg_replace('#^public/#i', '', $p);

        return Storage::disk('public')->url($p);
    }

    public function show($id)
    {
        $userId   = (int) $id;

        $local = UserProfile::where('user_id', $userId)->first();

        $authBase = rtrim(config('services.auth.base'), '/');
        $name = null;
        $authAvatar = null;
        $first = null;
        $last  = null;
        $email = null;

        try {
            $resp = Http::acceptJson()->get($authBase . '/public/users/' . $userId);
            if ($resp->ok()) {
                $first = $resp->json('first_name');
                $last  = $resp->json('last_name');
                $name  = trim(($first ? $first.' ' : '').($last ?? '')) ?: $resp->json('name');
                $authAvatar = $resp->json('avatar_url');
                $email = $resp->json('email');
            }
        } catch (\Throwable $e) {
        }

        return response()->json([
            'id'         => $userId,
            'name'       => $name,
            'first_name' => $first,
            'last_name'  => $last,
            'email'      => $email,
            'avatar_url' => $this->fileUrl($local?->avatar_path, $authAvatar),
        ]);
    }
}