<?php

namespace App\Http\Controllers;

use App\Models\CoachExercise;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CoachExerciseController extends Controller
{
    public function index(Request $r)
    {
        $uid = $r->user()?->id;
        if (!$uid) return response()->json(['message' => 'Unauthenticated.'], 401);

        $list = CoachExercise::where('user_id', $uid)
            ->orderBy('position')
            ->orderByDesc('id')
            ->get();

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

            // vienas iš dviejų: failas ARBA media_url
            'media'          => 'nullable|file|mimes:jpg,jpeg,png,gif,mp4,webm|max:30720',
            'media_url'      => 'nullable|string|max:2048',
        ]);

        $mediaPath = null; $mediaType = null; $externalUrl = null;

        if ($r->hasFile('media')) {
            $f = $r->file('media');
            $m = $f->getMimeType();
            $mediaType = str_starts_with($m, 'video') ? 'video' : ($m === 'image/gif' ? 'gif' : 'image');
            $stored    = $f->store('public/coach_media');
            $mediaPath = Storage::url($stored); // /storage/...
        } elseif (!empty($data['media_url'])) {
            $externalUrl = $data['media_url'];
            $u = strtolower($externalUrl);
            $mediaType = str_ends_with($u, '.gif') ? 'gif'
                      : ((str_ends_with($u, '.mp4') || str_contains($u, 'youtube') || str_contains($u, 'vimeo')) ? 'video' : 'external');
        }

        $nextPos = (int) CoachExercise::where('user_id', $uid)->max('position') + 1;

        $ex = CoachExercise::create([
            'user_id'        => $uid,
            'title'          => $data['title'],
            'description'    => $data['description'] ?? null,
            'equipment'      => $data['equipment'] ?? null,
            'primary_muscle' => $data['primary_muscle'] ?? null,
            'difficulty'     => $data['difficulty'] ?? null,
            'is_paid'        => $data['is_paid'] ?? false,
            'tags'           => $data['tags'] ?? null,
            'media_path'     => $mediaPath,
            'media_type'     => $mediaType,
            'external_url'   => $externalUrl,
            'position'       => $nextPos,
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

        // Media pakeitimas
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
                // išvalom viską
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

        // nepersistum media_url į DB — modelyje **nėra** tokio stulpelio
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

        $exIds = \App\Models\CoachExercise::where('user_id', $uid)->pluck('id')->toArray();

        foreach ($data['order'] as $id) {
            if (!in_array($id, $exIds, true)) {
                return response()->json(['message' => 'Invalid exercise id in order'], 422);
            }
        }

        \DB::transaction(function () use ($data, $uid) {
            foreach ($data['order'] as $pos => $id) {
                \App\Models\CoachExercise::where('id', $id)
                    ->where('user_id', $uid)
                    ->update(['position' => $pos + 1]);
            }
        });

        return response()->json(['status' => 'ok']);
    }
}