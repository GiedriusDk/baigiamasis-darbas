<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CoachProfile;
use Illuminate\Http\Request;

class AdminCoachController extends Controller
{
    protected function transform(CoachProfile $p): array
    {
        return [
            'id'                => $p->id,
            'user_id'           => $p->user_id,

            'email'             => $p->user->email ?? null,

            'bio'               => $p->bio,
            'city'              => $p->city,
            'country'           => $p->country,
            'experience_years'  => $p->experience_years,
            'specializations'   => $p->specializations,
            'availability_note' => $p->availability_note,
            'socials'           => $p->socials,
            'avatar_path'       => $p->avatar_path,
            'timezone'          => $p->timezone,
            'languages'         => $p->languages,
            'certifications'    => $p->certifications,
            'phone'             => $p->phone,
            'website_url'       => $p->website_url,
            'gym_name'          => $p->gym_name,
            'gym_address'       => $p->gym_address,

            'created_at'        => $p->created_at,
            'updated_at'        => $p->updated_at,
        ];
    }

    public function index(Request $request)
    {
        $query = CoachProfile::with('user:id,email')->orderBy('id', 'asc');

        if ($uid = $request->query('user_id')) {
            $query->where('user_id', $uid);
        }

        $profiles = $query->get();

        return response()->json([
            'data' => $profiles->map(fn($p) => $this->transform($p)),
        ]);
    }

    public function show(int $id)
    {
        $profile = CoachProfile::with('user:id,email')
            ->where('user_id', $id)
            ->firstOrFail();

        return response()->json($this->transform($profile));
    }

    public function update(Request $request, int $id)
    {
        $profile = CoachProfile::where('user_id', $id)->firstOrFail();

        $data = $request->validate([
            'bio'               => 'nullable|string',
            'city'              => 'nullable|string|max:255',
            'country'           => 'nullable|string|max:255',
            'experience_years'  => 'nullable|integer|min:0|max:80',
            'specializations'   => 'nullable',
            'availability_note' => 'nullable|string',
            'socials'           => 'nullable',
            'avatar_path'       => 'nullable|string|max:255',
            'timezone'          => 'nullable|string|max:255',
            'languages'         => 'nullable',
            'certifications'    => 'nullable',
            'phone'             => 'nullable|string|max:255',
            'website_url'       => 'nullable|string|max:255',
            'gym_name'          => 'nullable|string|max:255',
            'gym_address'       => 'nullable|string|max:255',
        ]);

        unset($data['id'], $data['user_id'], $data['created_at'], $data['updated_at']);

        $profile->fill($data)->save();

        return response()->json($this->transform($profile));
    }

    public function destroy(int $id)
    {
        $profile = CoachProfile::where('user_id', $id)->firstOrFail();
        $profile->delete();

        return response()->json(['message' => 'Coach profile deleted']);
    }
}