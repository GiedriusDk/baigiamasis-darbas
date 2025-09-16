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
        $q         = trim((string) $r->input('q', ''));
        $city      = trim((string) $r->input('city', ''));
        $spec      = trim((string) $r->input('spec', ''));
        $minPrice  = $r->input('min_price');
        $maxPrice  = $r->input('max_price');
        $expGte    = $r->input('experience_gte');
        $expLte    = $r->input('experience_lte');
        $page      = max(1, (int) $r->input('page', 1));
        $perPage   = min(50, max(1, (int) $r->input('per_page', 12)));

        $query = CoachProfile::query();

        if ($city !== '')            $query->where('city', 'like', '%'.$city.'%');
        if ($minPrice !== null)      $query->where('price_per_session', '>=', (int)$minPrice);
        if ($maxPrice !== null)      $query->where('price_per_session', '<=', (int)$maxPrice);
        if ($expGte !== null)        $query->where('experience_years', '>=', (int)$expGte);
        if ($expLte !== null)        $query->where('experience_years', '<=', (int)$expLte);

        if ($spec !== '') {
            $query->where(function ($q2) use ($spec) {
                $q2->whereJsonContains('specializations', $spec)
                   ->orWhere('specializations', 'like', '%'.$spec.'%');
            });
        }

        if ($q !== '') {
            $query->where(function ($qq) use ($q) {
                $qq->where('bio', 'like', '%'.$q.'%')
                   ->orWhere('city', 'like', '%'.$q.'%')
                   ->orWhere('availability_note', 'like', '%'.$q.'%')
                   ->orWhere('specializations', 'like', '%'.$q.'%');
            });
        }

        $query->orderByDesc('updated_at')->orderBy('id');
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        // Pasiimam AUTH bazę (pvz. http://gateway/auth/api)
        $authBase = rtrim(config('services.auth.base'), '/');

        $data = $paginator->getCollection()->map(function (CoachProfile $p) use ($authBase) {
            // Pabandom parsinešti vardą iš AUTH /public/users/{id}
            $name = null;
            $authAvatar = null;
            try {
                $resp = Http::acceptJson()->get($authBase.'/public/users/'.$p->user_id);
                if ($resp->ok()) {
                    $name = $resp->json('name');
                    $authAvatar = $resp->json('avatar_url');
                }
            } catch (\Throwable $e) {
                // tyliai praleidžiam
            }

            return [
                'id'                 => $p->id,
                'user_id'            => $p->user_id,
                'name'               => $name, // ← pridėta
                'city'               => $p->city,
                'avatar_path'        => $p->avatar_path ?: $authAvatar,
                'experience_years'   => $p->experience_years,
                'price_per_session'  => $p->price_per_session,
                'specializations'    => $p->specializations,
            ];
        });

        return response()->json([
            'data'      => $data,
            'page'      => $paginator->currentPage(),
            'per_page'  => $paginator->perPage(),
            'total'     => $paginator->total(),
        ]);
    }

    public function show($id)
    {
        $p = CoachProfile::findOrFail((int)$id);

        $name = null; $authAvatar = null;
        $authBase = rtrim(config('services.auth.base'), '/');
        try {
            $resp = Http::acceptJson()->get($authBase.'/public/users/'.$p->user_id);
            if ($resp->ok()) {
                $name       = $resp->json('name');
                $authAvatar = $resp->json('avatar_url');
            }
        } catch (\Throwable $e) { /* ignore */ }

        return response()->json([
            'id'                 => $p->id,
            'user_id'            => $p->user_id,
            'name'               => $name,
            'city'               => $p->city,
            'bio'                => $p->bio,
            'avatar_path'        => $p->avatar_path ?: $authAvatar,
            'experience_years'   => $p->experience_years,
            'price_per_session'  => $p->price_per_session,
            'specializations'    => $p->specializations,
            'availability_note'  => $p->availability_note,
        ]);
    }

    public function exercises($id)
    {
        $p = CoachProfile::findOrFail((int)$id);

        $items = CoachExercise::where('user_id', $p->user_id)
            ->orderBy('position')->orderByDesc('id')->get();

        return response()->json($items->map(function (CoachExercise $e) {
            return [
                'id'             => $e->id,
                'title'          => $e->title,
                'description'    => $e->description,
                'primary_muscle' => $e->primary_muscle,
                'difficulty'     => $e->difficulty,
                'media_url'      => $e->external_url ?: $e->media_path,
                'is_paid'        => (bool)$e->is_paid,
                'position'       => $e->position,
            ];
        }));
    }
}