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
        return response()->json($p);
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
            'available_minutes'  => 'nullable|integer|min:0|max:300',
            'preferred_days'     => 'nullable|array',
            'preferred_days.*'   => 'in:mon,tue,wed,thu,fri,sat,sun',
            'equipment'          => 'nullable|array',
            'equipment.*'        => 'string|max:60',
            'preferences'        => 'nullable|array',
            'injuries_note'      => 'nullable|string',
            // avatar_path čia nepriimam – jis ateina per upload()
        ]);

        $profile = UserProfile::firstOrNew(['user_id' => $uid]);
        $profile->fill($data)->save();

        return response()->json($profile);
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