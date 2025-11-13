<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Entry;
use App\Models\Photo;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class PhotosController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        return (int)($u['id'] ?? 0);
    }

    public function index(Request $r, Entry $entry)
    {
        $me = $this->me($r);
        if ($entry->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);
        return response()->json(['data' => $entry->photos()->orderByDesc('id')->get()]);
    }

    public function store(Request $r)
    {
        $me = $this->me($r);

        $data = $r->validate([
            'entry_id' => ['required','integer','min:1'],
            'image'    => ['required','file','mimes:jpg,jpeg,png','max:8192'],
            'pose'     => ['nullable','string','max:32'],
            'taken_at' => ['nullable','date'],
        ]);

        $entry = Entry::findOrFail($data['entry_id']);
        if ($entry->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);

        $file = $data['image'];
        $fn = Str::uuid()->toString().'.'.$file->getClientOriginalExtension();
        $path = "progress/{$me}/".date('Y/m')."/".$fn;

        Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));

        $photo = Photo::create([
            'user_id'  => $me,
            'entry_id' => $entry->id,
            'path'     => $path,
            'width'    => null,
            'height'   => null,
            'pose'     => $data['pose'] ?? null,
            'taken_at' => $data['taken_at'] ?? null,
        ]);

        return response()->json(['data' => $photo], 201);
    }

    public function destroy(Request $r, Photo $photo)
    {
        $me = $this->me($r);
        if ($photo->user_id !== $me) return response()->json(['message'=>'Forbidden'], 403);

        if ($photo->path) Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json(['ok' => true]);
    }
}