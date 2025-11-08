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

        // Jei jau pilnas URL – grąžinam tokį, koks yra
        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        $p = parse_url($path, PHP_URL_PATH) ?: $path;
        $p = ltrim($p, '/');

        // Šita eilutė pašalina viską iki „public/“
        // pvz: profiles/storage/public/... -> ...
        $p = preg_replace('#^(profiles/)?storage/public/#i', '', $p);
        $p = preg_replace('#^public/#i', '', $p);

        return Storage::disk('public')->url($p);
    }

    public function show($id)
    {
        $userId   = (int) $id;

        // bandome rasti vietinį user profile (avatar_path ir pan.)
        $local = UserProfile::where('user_id', $userId)->first();

        // pasiimame bazinius duomenis iš AUTH serviso
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
            // paliekam tuščia, grąžinsim ką turim
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