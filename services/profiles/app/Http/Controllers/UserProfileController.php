<?php

namespace App\Http\Controllers;

use App\Models\UserProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserProfileController extends Controller
{
    public function show(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $p = UserProfile::firstOrCreate(['user_id' => $uid], []);

        return response()->json([
            'id'                 => $p->id,
            'sex'                => $p->sex,
            'birth_date'         => $p->birth_date?->toDateString(),
            'height_cm'          => $p->height_cm,
            'weight_kg'          => $p->weight_kg,
            'goal'               => $p->goal,
            'activity_level'     => $p->activity_level,
            'sessions_per_week'  => $p->sessions_per_week,
            'available_minutes'  => $p->available_minutes,
            'preferred_days'     => $p->preferred_days ?? [],
            'equipment'          => $p->equipment ?? [],
            'preferences'        => $p->preferences ?? [],
            'injuries'           => $p->injuries ?? [],
            'avatar_path'        => $p->avatar_path,
        ]);
    }

    public function update(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $data = $r->validate([
            'sex'                => 'nullable|in:male,female,other',
            'birth_date'         => 'nullable|date',
            'height_cm'          => 'nullable|integer|min:100|max:250',
            'weight_kg'          => 'nullable|numeric|min:30|max:400',
            'goal'               => 'nullable|in:fat_loss,muscle_gain,performance,general_fitness',
            'activity_level'     => 'nullable|in:sedentary,light,moderate,active,very_active',
            'sessions_per_week'  => 'nullable|integer|min:0|max:14',
            'available_minutes'  => 'nullable|integer|in:30,45,60,75,90',
            'preferred_days'     => 'nullable|array',
            'preferred_days.*'   => 'in:mon,tue,wed,thu,fri,sat,sun',
            'equipment'          => 'nullable|array',
            'equipment.*'        => 'string|max:60',
            'preferences'        => 'nullable|array',
            'injuries'           => 'nullable|array',
            'injuries.*'           => 'string|max:60',
        ]);

        if (array_key_exists('equipment', $data) && $data['equipment'] === null) $data['equipment'] = [];
        if (array_key_exists('injuries', $data) && $data['injuries'] === null) $data['injuries'] = [];
        if (array_key_exists('preferred_days', $data) && $data['preferred_days'] === null) $data['preferred_days'] = [];
        if (array_key_exists('preferences', $data) && $data['preferences'] === null) $data['preferences'] = [];

        $profile = UserProfile::firstOrNew(['user_id' => $uid]);
        $profile->fill($data)->save();

        return $this->show($r);
    }

    public function upload(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $r->validate([
            'file' => 'required|file|mimes:jpg,jpeg,png,webp,gif|max:5120',
        ]);

        $profile = UserProfile::firstOrCreate(['user_id' => $uid], []);

        if ($profile->avatar_path) {
            Storage::delete(str_replace('/storage/', 'public/', $profile->avatar_path));
        }

        $stored = $r->file('file')->store('public/user_avatars');
        $url = Storage::url($stored);

        $profile->avatar_path = $url;
        $profile->save();

        return response()->json(['url' => $url]);
    }
}