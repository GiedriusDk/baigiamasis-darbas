<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ForumController extends Controller
{
    public function rooms()
    {
        $rooms = Conversation::forum()
            ->select('id', 'slug', 'title')
            ->orderBy('title')
            ->get();

        return response()->json(['data' => $rooms]);
    }

    public function messages(Request $r, Conversation $room)
    {
        abort_unless($room->type === 'forum', 404);

        $messages = Message::where('room_id', $room->id)
            ->orderBy('created_at')
            ->limit(200)
            ->get();

        return response()->json(['data' => $messages]);
    }

    public function send(Request $r, Conversation $room)
    {
        abort_unless($room->type === 'forum', 404);

        $userId = $r->user()->id;

        $data = $r->validate([
            'message'    => ['required_without:attachment', 'nullable', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif,mp4,webm|max:10240'],
        ]);

        $attachmentUrl = null;

        
        if ($r->hasFile('attachment')) {

            
            $stored = $r->file('attachment')->store('public/forum_attachments');

            
            $attachmentUrl = url(Storage::url($stored));
            
        }

        $msg = Message::create([
            'room_id'        => $room->id,
            'sender_id'      => $userId,
            'message'        => $data['message'] ?? null,
            'attachment_url' => $attachmentUrl,
        ]);

        return response()->json(['data' => $msg], 201);
    }
}