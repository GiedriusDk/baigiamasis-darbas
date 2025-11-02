<?php

namespace App\Http\Controllers;

use App\Models\CoachProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CoachProfileController extends Controller
{
    private function normalizeToRelative(?string $incoming): ?string
    {
        if (!$incoming) return null;
        $rel = parse_url($incoming, PHP_URL_PATH) ?: $incoming;
        if (($pos = strripos($rel, '/storage/')) !== false) $rel = substr($rel, $pos + strlen('/storage/'));
        if (str_starts_with($rel, 'public/')) $rel = substr($rel, strlen('public/'));
        return ltrim($rel, '/');
    }

    public function show(Request $request)
    {
        $uid = $request->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $p = CoachProfile::firstOrCreate(['user_id' => $uid]);
        $data = $p->toArray();
        $rel = $this->normalizeToRelative($p->avatar_path);
        $data['avatar_path'] = $rel ? Storage::disk('public')->url($rel) : null;

        return response()->json($data);
    }

    public function update(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $data = $r->validate([
            'bio'               => 'nullable|string',
            'city'              => 'nullable|string|max:120',
            'country'           => 'nullable|string|max:120',
            'experience_years'  => 'nullable|integer|min:0|max:80',
            'specializations'   => 'nullable',
            'availability_note' => 'nullable|string',
            'timezone'          => 'nullable|string|max:64',
            'languages'         => 'nullable',
            'certifications'    => 'nullable',
            'phone'             => 'nullable|string|max:64',
            'website_url'       => 'nullable|url|max:255',
            'gym_name'          => 'nullable|string|max:120',
            'gym_address'       => 'nullable|string|max:255',
            'avatar_path'       => 'nullable',
            'socials'           => 'nullable|array',
        ]);

        foreach (['specializations','languages','certifications'] as $k) {
            if (isset($data[$k]) && is_string($data[$k])) {
                $data[$k] = array_values(array_filter(array_map('trim', explode(',', $data[$k]))));
            }
        }

        $p = CoachProfile::firstOrCreate(['user_id' => $uid]);

        if ($r->has('avatar_path')) {
            $rel = $this->normalizeToRelative($data['avatar_path'] ?? null);
            if ($rel === null || $rel === '') {
                if ($p->avatar_path) Storage::disk('public')->delete($p->avatar_path);
                $p->avatar_path = null;
            } else {
                $p->avatar_path = $rel;
            }
            unset($data['avatar_path']);
        }

        if (!empty($data['socials']) && is_array($data['socials'])) {
            $p->socials = $data['socials'];
            unset($data['socials']);
        }

        $p->fill($data)->save();

        $out = $p->fresh()->toArray();
        $rel = $this->normalizeToRelative($p->avatar_path);
        $out['avatar_path'] = $rel ? Storage::disk('public')->url($rel) : null;

        return response()->json($out);
    }

    public function upload(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $r->validate(['file' => 'required|file|mimes:jpg,jpeg,png,webp,gif|max:5120']);

        $profile = CoachProfile::firstOrCreate(['user_id' => $uid], []);
        if ($profile->avatar_path) Storage::disk('public')->delete($profile->avatar_path);

        $stored = $r->file('file')->store('coach_avatars', 'public');
        $profile->avatar_path = $stored;
        $profile->save();

        return response()->json([
            'path' => $stored,
            'url'  => Storage::disk('public')->url($stored),
        ]);
    }
}