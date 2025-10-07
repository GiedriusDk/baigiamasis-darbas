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

        $socials = [];
        if (isset($data['socials']) && is_array($data['socials'])) {
            $socials = $data['socials'];
        }
        foreach (['instagram', 'facebook', 'youtube', 'linkedin', 'tiktok', 'other'] as $k) {
            if (!empty($data[$k])) {
                $socials[$k] = $data[$k];
            }
            unset($data[$k]);
        }
        if (!empty($socials)) {
            $data['socials'] = $socials;
        }

        $p = CoachProfile::firstOrCreate(['user_id' => $uid], []);
        unset($data['avatar_path']);
        $p->fill($data)->save();

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