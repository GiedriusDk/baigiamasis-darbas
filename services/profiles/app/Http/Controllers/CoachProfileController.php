<?php

namespace App\Http\Controllers;

use App\Models\CoachProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CoachProfileController extends Controller
{
    public function show(Request $request)
    {
        $uid = $request->user()?->id;
        if (!$uid) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $p = CoachProfile::firstOrCreate(['user_id' => $uid], []);
        return response()->json($p);
    }

    public function update(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

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

            'gym_name'          => 'nullable|string|max:255',
            'gym_address'       => 'nullable|string|max:255',

            'socials'           => 'nullable|array',
            'instagram'         => 'nullable|url|max:255',
            'facebook'          => 'nullable|url|max:255',
            'youtube'           => 'nullable|url|max:255',
            'linkedin'          => 'nullable|url|max:255',
            'tiktok'            => 'nullable|url|max:255',
            'other'             => 'nullable|url|max:255',
        ]);

        if (isset($data['specializations']) && is_string($data['specializations'])) {
            $data['specializations'] = array_values(array_filter(array_map('trim', explode(',', $data['specializations']))));
        }
        if (isset($data['languages']) && is_string($data['languages'])) {
            $data['languages'] = array_values(array_filter(array_map('trim', explode(',', $data['languages']))));
        }
        if (isset($data['certifications']) && is_string($data['certifications'])) {
            $data['certifications'] = array_values(array_filter(array_map('trim', explode(',', $data['certifications']))));
        }

        $p = CoachProfile::firstOrCreate(['user_id' => $uid], []);

        $mergedSocials = is_array($p->socials) ? $p->socials : [];
        if (isset($data['socials']) && is_array($data['socials'])) {
            $mergedSocials = array_merge($mergedSocials, $data['socials']);
        }
        foreach (['instagram','facebook','youtube','linkedin','tiktok','other'] as $k) {
            if (array_key_exists($k, $data) && $data[$k] !== null && $data[$k] !== '') {
                $mergedSocials[$k] = $data[$k];
            }
        }
        $mergedSocials = array_filter($mergedSocials, fn($v) => $v !== null && $v !== '');

        $payload = [
            'bio'               => $data['bio'] ?? null,
            'city'              => $data['city'] ?? null,
            'country'           => $data['country'] ?? null,
            'timezone'          => $data['timezone'] ?? null,
            'experience_years'  => $data['experience_years'] ?? 0,
            'availability_note' => $data['availability_note'] ?? null,
            'specializations'   => $data['specializations'] ?? [],
            'languages'         => $data['languages'] ?? [],
            'certifications'    => $data['certifications'] ?? [],
            'phone'             => $data['phone'] ?? null,
            'website_url'       => $data['website_url'] ?? null,
            'gym_name'          => $data['gym_name'] ?? null,
            'gym_address'        => $data['gym_address'] ?? null,
            'socials'           => $mergedSocials,
        ];

        unset($payload['avatar_path']);

        $p->fill($payload)->save();

        return response()->json($p->fresh());
    }

    public function upload(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $r->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp|max:5120',
        ]);

        $p = CoachProfile::firstOrCreate(['user_id' => $uid], []);

        if ($p->avatar_path) {
            Storage::delete(str_replace('/storage/', 'public/', $p->avatar_path));
        }

        $stored = $r->file('file')->store('public/avatars');
        $p->avatar_path = Storage::url($stored);
        $p->save();

        return response()->json(['url' => $p->avatar_path]);
    }
}