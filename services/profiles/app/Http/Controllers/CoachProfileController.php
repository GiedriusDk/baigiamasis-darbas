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
        if (!$uid) return response()->json(['message'=>'Unauthenticated.'], 401);

        $p = CoachProfile::firstOrCreate(['user_id' => $uid], []);
        return response()->json($p);
    }

    // services/profiles/app/Http/Controllers/CoachProfileController.php

public function update(Request $r)
{
    // ✅ vietoje auth()->id()
    $uid = $r->user()?->id;
    if (!$uid) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    $data = $r->validate([
        'bio'               => 'nullable|string',
        'city'              => 'nullable|string|max:120',
        'experience_years'  => 'nullable|integer|min:0|max:80',
        'price_per_session' => 'nullable|integer|min:0|max:100000',
        // leidžiam ir JSON masyvą, ir CSV stringą
        'specializations'   => 'nullable',
        'availability_note' => 'nullable|string',
    ]);

    // jei ateina "weight loss, strength" – paversk į masyvą
    if (isset($data['specializations']) && is_string($data['specializations'])) {
        $data['specializations'] = array_values(array_filter(array_map('trim', explode(',', $data['specializations']))));
    }

    $p = CoachProfile::firstOrCreate(['user_id' => $uid], []);
    $p->fill($data)->save();

    return response()->json($p->fresh());
}

public function upload(Request $r)
{
    // ✅ čia irgi
    $uid = $r->user()?->id;
    if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

    $r->validate([
        'file' => 'required|file|mimes:jpg,jpeg,png,gif,webp|max:5120',
    ]);

    $p = CoachProfile::firstOrCreate(['user_id' => $uid], []);

    if ($p->avatar_path) {
        \Storage::delete(str_replace('/storage/', 'public/', $p->avatar_path));
    }

    $stored = $r->file('file')->store('public/avatars');
    $p->avatar_path = \Storage::url($stored);
    $p->save();

    return response()->json(['url' => $p->avatar_path]);
}
  
}