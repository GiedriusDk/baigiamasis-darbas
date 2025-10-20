<?php

namespace App\Http\Controllers;

use App\Models\CoachExercise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CoachExerciseController extends Controller
{
    public function index(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $q = \App\Models\CoachExercise::where('user_id', $uid);

        if ($r->boolean('only_custom'))   $q->whereNull('catalog_id');
        if ($r->boolean('only_imported')) $q->whereNotNull('catalog_id');

        $list = $q->orderBy('position')->orderByDesc('id')->get();
        return response()->json($list);
    }

    public function store(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $data = $r->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'equipment'      => 'nullable|string|max:120',
            'primary_muscle' => 'nullable|string|max:120',
            'difficulty'     => 'nullable|in:easy,medium,hard',
            'is_paid'        => 'nullable|boolean',
            'tags'           => 'nullable|array',
            'tags.*'         => 'string|max:40',
            'media'          => 'nullable|file|mimes:jpg,jpeg,png,gif,mp4,webm|max:30720',
            'media_url'      => 'nullable|string|max:2048',
        ]);

        $mediaPath = null; $mediaType = null; $externalUrl = null;

        if ($r->hasFile('media')) {
            $f = $r->file('media');
            $m = $f->getMimeType();
            $mediaType = str_starts_with($m, 'video') ? 'video' : ($m === 'image/gif' ? 'gif' : 'image');
            $stored    = $f->store('public/coach_media');
            $mediaPath = Storage::url($stored);
        } elseif (!empty($data['media_url'])) {
            $externalUrl = $data['media_url'];
            $u = strtolower($externalUrl);
            $mediaType = str_ends_with($u, '.gif') ? 'gif'
                : ((str_ends_with($u, '.mp4') || str_contains($u, 'youtube') || str_contains($u, 'vimeo')) ? 'video' : 'external');
        }

        $nextPos = (int) CoachExercise::where('user_id', $uid)->max('position') + 1;

        $ex = CoachExercise::create([
            'user_id'            => $uid,
            'source'             => 'custom',
            'source_catalog_id'  => null,
            'title'              => $data['title'],
            'description'        => $data['description'] ?? null,
            'equipment'          => $data['equipment'] ?? null,
            'primary_muscle'     => $data['primary_muscle'] ?? null,
            'difficulty'         => $data['difficulty'] ?? null,
            'is_paid'            => $data['is_paid'] ?? false,
            'tags'               => $data['tags'] ?? null,
            'media_path'         => $mediaPath,
            'media_type'         => $mediaType,
            'external_url'       => $externalUrl,
            'position'           => $nextPos,
        ]);

        return response()->json($ex, 201);
    }

    public function update(Request $r, CoachExercise $coachExercise)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);
        if ($coachExercise->user_id !== (int) $uid) return response()->json(['message' => 'Forbidden'], 403);

        $data = $r->validate([
            'title'          => 'sometimes|required|string|max:255',
            'description'    => 'nullable|string',
            'equipment'      => 'nullable|string|max:120',
            'primary_muscle' => 'nullable|string|max:120',
            'difficulty'     => 'nullable|in:easy,medium,hard',
            'is_paid'        => 'nullable|boolean',
            'tags'           => 'nullable|array',
            'tags.*'         => 'string|max:40',
            'media'          => 'nullable|file|mimes:jpg,jpeg,png,gif,mp4,webm|max:30720',
            'media_url'      => 'nullable|string|max:2048',
        ]);

        if ($r->hasFile('media')) {
            if ($coachExercise->media_path) {
                Storage::delete(str_replace('/storage/', 'public/', $coachExercise->media_path));
            }
            $f = $r->file('media');
            $m = $f->getMimeType();
            $type = str_starts_with($m, 'video') ? 'video' : ($m === 'image/gif' ? 'gif' : 'image');
            $stored = $f->store('public/coach_media');

            $coachExercise->media_path   = Storage::url($stored);
            $coachExercise->media_type   = $type;
            $coachExercise->external_url = null;
        } elseif ($r->exists('media_url')) {
            $url = trim((string)($data['media_url'] ?? ''));
            if ($url === '') {
                if ($coachExercise->media_path) {
                    Storage::delete(str_replace('/storage/', 'public/', $coachExercise->media_path));
                }
                $coachExercise->media_path = null;
                $coachExercise->external_url = null;
                $coachExercise->media_type = null;
            } else {
                if ($coachExercise->media_path) {
                    Storage::delete(str_replace('/storage/', 'public/', $coachExercise->media_path));
                }
                $u = strtolower($url);
                $coachExercise->media_path = null;
                $coachExercise->external_url = $url;
                $coachExercise->media_type = str_ends_with($u, '.gif') ? 'gif'
                    : ((str_ends_with($u, '.mp4') || str_contains($u, 'youtube') || str_contains($u, 'vimeo')) ? 'video' : 'external');
            }
        }

        $coachExercise->fill([
            'title'          => $data['title']          ?? $coachExercise->title,
            'description'    => $data['description']    ?? $coachExercise->description,
            'equipment'      => $data['equipment']      ?? $coachExercise->equipment,
            'primary_muscle' => $data['primary_muscle'] ?? $coachExercise->primary_muscle,
            'difficulty'     => $data['difficulty']     ?? $coachExercise->difficulty,
            'is_paid'        => array_key_exists('is_paid', $data) ? (bool)$data['is_paid'] : $coachExercise->is_paid,
            'tags'           => $data['tags']           ?? $coachExercise->tags,
        ])->save();

        return response()->json($coachExercise);
    }

    public function destroy(Request $r, CoachExercise $coachExercise)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);
        if ($coachExercise->user_id !== (int)$uid) return response()->json(['message' => 'Forbidden'], 403);

        if ($coachExercise->media_path) {
            Storage::delete(str_replace('/storage/', 'public/', $coachExercise->media_path));
        }
        $coachExercise->delete();

        return response()->json(['ok' => true]);
    }

    public function reorder(Request $request)
    {
        $uid = $request->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $data = $request->validate([
            'order'   => ['required', 'array', 'min:1'],
            'order.*' => ['integer'],
        ]);

        $exIds = CoachExercise::where('user_id', $uid)->pluck('id')->toArray();

        foreach ($data['order'] as $id) {
            if (!in_array($id, $exIds, true)) {
                return response()->json(['message' => 'Invalid exercise id in order'], 422);
            }
        }

        DB::transaction(function () use ($data, $uid) {
            foreach ($data['order'] as $pos => $id) {
                CoachExercise::where('id', $id)
                    ->where('user_id', $uid)
                    ->update(['position' => $pos + 1]);
            }
        });

        return response()->json(['status' => 'ok']);
    }

    public function shared(Request $r)
    {
        $base = rtrim(env('CATALOG_BASE'), '/');
        $allowed = ['page','per_page','q','equipment','muscles','tag'];
        $qs = [];
        foreach ($allowed as $k) {
            $v = $r->query($k);
            if ($v !== null && $v !== '') $qs[$k] = $v;
        }
        $url = $base.'/exercises'.(empty($qs) ? '' : ('?'.http_build_query($qs)));
        $res = Http::acceptJson()->get($url);
        if (!$res->ok()) {
            return response()->json(['message' => $res->json('message') ?? 'Catalog error'], $res->status());
        }
        return response()->json($res->json());
    }

    public function sharedShow(int $id)
    {
        $base = rtrim(env('CATALOG_BASE'), '/');
        $url = $base.'/exercises/'.$id;
        $res = Http::acceptJson()->get($url);
        if ($res->status() === 404) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if (!$res->ok()) {
            return response()->json(['message' => 'Catalog error'], 422);
        }
        return response()->json($res->json());
    }

    public function importFromCatalog(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $data = $r->validate(['catalog_id' => ['required','integer','min:1']]);

        $base = rtrim(env('CATALOG_BASE'), '/');
        $res  = \Illuminate\Support\Facades\Http::acceptJson()->get($base.'/exercises/'.$data['catalog_id']);
        if ($res->status() === 404) return response()->json(['message' => 'Not found'], 404);
        if (!$res->ok())           return response()->json(['message' => 'Catalog error'], 422);

        $src = $res->json('data') ?? [];

        $title = $src['name'] ?? ($src['title'] ?? 'Exercise');
        $desc  = !empty($src['instructions']) ? json_encode($src['instructions']) : ($src['description'] ?? null);
        $media = $src['image_url'] ?? ($src['media_url'] ?? null);
        $u = strtolower((string)$media);
        $mediaType = $media
            ? (\Illuminate\Support\Str::endsWith($u, '.gif') ? 'gif'
                : ((\Illuminate\Support\Str::endsWith($u, '.mp4') || str_contains($u, 'youtube') || str_contains($u, 'vimeo')) ? 'video' : 'external'))
            : null;

        $ex = \App\Models\CoachExercise::create([
            'user_id'        => $uid,
            'catalog_id'     => (int)$data['catalog_id'],
            'imported_at'    => now(),
            'title'          => $title,
            'description'    => $desc,
            'primary_muscle' => $src['primary_muscle'] ?? null,
            'difficulty'     => $src['difficulty'] ?? null,
            'equipment'      => $src['equipment'] ?? null,
            'tags'           => $src['tags'] ?? [],
            'media_path'     => null,
            'media_type'     => $mediaType,
            'external_url'   => $media,
            'position'       => ((int)\App\Models\CoachExercise::where('user_id',$uid)->max('position')) + 1,
        ]);

        return response()->json(['data' => $ex], 201);
    }
}