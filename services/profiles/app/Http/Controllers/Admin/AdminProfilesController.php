<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserProfile;
use Illuminate\Http\Request;

class AdminProfilesController extends Controller
{
    protected function transformUserProfile(UserProfile $p): array
    {
        return [
            'id'                => $p->id,
            'user_id'           => $p->user_id,
            'first_name'        => null,
            'last_name'         => null,
            'email'             => $p->user->email ?? null,
            'city'              => $p->city,
            'birth_date'        => $p->birth_date,
            'height_cm'         => $p->height_cm,
            'weight_kg'         => $p->weight_kg,
            'goal'              => $p->goal,
            'sex'               => $p->sex,
            'activity_level'    => $p->activity_level,
            'sessions_per_week' => $p->sessions_per_week,
            'available_minutes' => $p->available_minutes,
            'equipment'         => $p->equipment,
            'preferences'       => $p->preferences,
            'injuries'          => $p->injuries,
            'created_at'        => $p->created_at,
            'updated_at'        => $p->updated_at,
        ];
    }

    public function index(Request $request)
    {
        $query = UserProfile::with('user:id,email')
            ->orderBy('id', 'asc');

        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }

        $profiles = $query->get();

        return response()->json([
            'data' => $profiles->map(fn (UserProfile $p) => $this->transformUserProfile($p)),
        ]);
    }

    public function show(int $id)
    {
        $profile = UserProfile::with('user:id,email')
            ->where('user_id', $id)
            ->firstOrFail();

        return response()->json(
            $this->transformUserProfile($profile)
        );
    }

    public function update(Request $request, int $id)
    {
        $profile = UserProfile::where('user_id', $id)->firstOrFail();

        $data = $request->validate([
            'city'              => 'nullable|string|max:120',
            'birth_date'        => 'nullable|date',
            'height_cm'         => 'nullable|numeric',
            'weight_kg'         => 'nullable|numeric',
            'goal'              => 'nullable|string|max:255',
            'sex'               => 'nullable|string|max:20',
            'activity_level'    => 'nullable|string|max:100',
            'sessions_per_week' => 'nullable|integer|min:0|max:21',
            'available_minutes' => 'nullable|integer|min:0|max:600',
            'equipment'         => 'nullable',
            'preferences'       => 'nullable',
            'injuries'          => 'nullable',
        ]);

        unset($data['id'], $data['user_id'], $data['created_at'], $data['updated_at']);

        $profile->fill($data);
        $profile->save();

        return response()->json(
            $this->transformUserProfile($profile)
        );
    }

    public function destroy(int $id)
    {
        $profile = UserProfile::where('user_id', $id)->firstOrFail();
        $profile->delete();

        return response()->json([
            'message' => 'User profile deleted',
        ]);
    }
}