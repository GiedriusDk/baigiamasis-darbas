<?php

namespace App\Http\Controllers;

use App\Models\CoachProfile;
use App\Models\CoachExercise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class CoachPublicController extends Controller
{
    public function index(Request $r)
    {
        $q        = trim((string) $r->input('q', ''));
        $city     = trim((string) $r->input('city', ''));
        $gym      = trim((string) $r->input('gym', ''));
        $spec     = trim((string) $r->input('spec', ''));
        $minPrice = $r->input('min_price');
        $maxPrice = $r->input('max_price');
        $expGte   = $r->input('experience_gte');
        $expLte   = $r->input('experience_lte');
        $page     = max(1, (int) $r->input('page', 1));
        $perPage  = min(50, max(1, (int) $r->input('per_page', 12)));

        $query = CoachProfile::query();

        if ($city !== '')       $query->where('city', 'ilike', "%{$city}%");
        if ($gym !== '')        $query->where(function ($qq) use ($gym) {
                                    $qq->where('gym_name', 'ilike', "%{$gym}%")
                                    ->orWhere('gym_address', 'ilike', "%{$gym}%");
                                });
        if ($minPrice !== null) $query->where('price_per_session', '>=', (int) $minPrice);
        if ($maxPrice !== null) $query->where('price_per_session', '<=', (int) $maxPrice);
        if ($expGte !== null)   $query->where('experience_years', '>=', (int) $expGte);
        if ($expLte !== null)   $query->where('experience_years', '<=', (int) $expLte);
        if ($spec !== '') {
            $query->where(function ($q2) use ($spec) {
                $q2->whereJsonContains('specializations', $spec)
                ->orWhere('specializations', 'ilike', "%{$spec}%");
            });
        }

        $authBase = rtrim(config('services.auth.base'), '/');
        $profiles = $query->orderByDesc('updated_at')->orderBy('id')->get();

        $rows = $profiles->map(function (CoachProfile $p) use ($authBase) {
            $name = null;
            $authAvatar = null;
            try {
                $resp = \Illuminate\Support\Facades\Http::acceptJson()
                    ->get($authBase.'/public/users/'.$p->user_id);
                if ($resp->ok()) {
                    $first = $resp->json('first_name');
                    $last  = $resp->json('last_name');
                    $name  = trim(($first ? $first.' ' : '').($last ?? '')) ?: $resp->json('name');
                    $authAvatar = $resp->json('avatar_url');
                }
            } catch (\Throwable $e) {}

            return [
                'id'                => $p->id,
                'user_id'           => $p->user_id,
                'name'              => $name,
                'city'              => $p->city,
                'gym_name'          => $p->gym_name,
                'gym_address'       => $p->gym_address,
                'avatar_path'       => $p->avatar_path ?: $authAvatar,
                'experience_years'  => $p->experience_years,
                'price_per_session' => $p->price_per_session,
                'specializations'   => $p->specializations,
                'bio'               => $p->bio,
                'availability_note' => $p->availability_note,
            ];
        });

        if ($q !== '') {
            $qq = mb_strtolower($q);
            $rows = $rows->filter(function ($row) use ($qq) {
                $specs = is_array($row['specializations']) ? implode(' ', $row['specializations']) : (string)$row['specializations'];
                $hay = mb_strtolower(trim(
                    ($row['name'] ?? '').' '.
                    ($row['city'] ?? '').' '.
                    ($row['gym_name'] ?? '').' '.
                    ($row['gym_address'] ?? '').' '.
                    ($row['bio'] ?? '').' '.
                    ($row['availability_note'] ?? '').' '.
                    $specs
                ));
                return $hay !== '' && mb_strpos($hay, $qq) !== false;
            })->values();
        }

        $total  = $rows->count();
        $offset = ($page - 1) * $perPage;
        $paged  = $rows->slice($offset, $perPage)->values();

        return response()->json([
            'data'     => $paged,
            'page'     => $page,
            'per_page' => $perPage,
            'total'    => $total,
        ]);
    }

    public function show($id)
    {
        $profile = \App\Models\CoachProfile::where('id', (int)$id)
            ->orWhere('user_id', (int)$id)
            ->firstOrFail();

        $authBase = rtrim(config('services.auth.base'), '/');
        $name = null; 
        $authAvatar = null;
        try {
            $resp = \Illuminate\Support\Facades\Http::acceptJson()
                ->get($authBase . '/public/users/' . $profile->user_id);
            if ($resp->ok()) {
                $name = $resp->json('name');
                $authAvatar = $resp->json('avatar_url');
            }
        } catch (\Throwable $e) {}

        $s = is_array($profile->socials) ? $profile->socials : [];

        return response()->json([
            'id'                => $profile->id,
            'user_id'           => $profile->user_id,
            'name'              => $name,
            'avatar_path'       => $profile->avatar_path ?: $authAvatar,

            'bio'               => $profile->bio,
            'experience_years'  => $profile->experience_years,
            'specializations'   => $profile->specializations,
            'certifications'    => $profile->certifications,
            'languages'         => $profile->languages,
            'availability_note' => $profile->availability_note,

            'city'              => $profile->city,
            'country'           => $profile->country,
            'timezone'          => $profile->timezone,

            'phone'             => $profile->phone,
            'website'           => $profile->website_url,
            'gym_name'           => $profile->gym_name,
            'gym_address'        => $profile->gym_address,

            'instagram'         => $s['instagram'] ?? null,
            'facebook'          => $s['facebook'] ?? null,
            'youtube'           => $s['youtube'] ?? null,
            'tiktok'            => $s['tiktok'] ?? null,
            'linkedin'          => $s['linkedin'] ?? null,
            'other'             => $s['other'] ?? null,
        ]);
    }

    public function exercises($id)
    {
        $profile = \App\Models\CoachProfile::where('id', (int)$id)
            ->orWhere('user_id', (int)$id)
            ->firstOrFail();

        $items = \App\Models\CoachExercise::where('user_id', $profile->user_id)
            ->orderBy('position')
            ->orderByDesc('id')
            ->get();

        return response()->json($items->map(function (\App\Models\CoachExercise $e) {
            return [
                'id'             => $e->id,
                'title'          => $e->title,
                'description'    => $e->description,
                'primary_muscle' => $e->primary_muscle,
                'difficulty'     => $e->difficulty,
                'media_url'      => $e->external_url ?: $e->media_path,
                'is_paid'        => (bool)$e->is_paid,
                'position'       => $e->position,
                'catalog_id'     => $e->catalog_id,
                'is_catalog'     => $e->catalog_id !== null,
            ];
        }));
    }
}