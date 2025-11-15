<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessagesController extends Controller
{
    protected function me(Request $r): int
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        return (int)($u['id'] ?? 0);
    }

    protected function canAccess(Request $r, Conversation $c): bool
    {
        $me = $this->me($r);
        return $c->user_id === $me || $c->coach_id === $me;
    }

    public function index(Request $r, Conversation $conversation)
    {
        if (!$this->canAccess($r, $conversation)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $page    = max(1, (int)$r->query('page', 1));
        $perPage = max(10, min((int)$r->query('per_page', 30), 100));

        $items = Message::query()
            ->where('room_id', $conversation->id)
            ->orderByDesc('id')
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'data'     => $items,
            'page'     => $page,
            'per_page' => $perPage,
        ]);
    }

    public function store(Request $r, Conversation $conversation)
    {
        if (!$this->canAccess($r, $conversation)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $r->validate([
            'body'       => ['required_without:attachment', 'nullable', 'string', 'max:5000'],
            'attachment' => ['nullable', 'file', 'max:10240'], // ~10 MB
        ]);

        $me = $this->me($r);

        $attachmentUrl = null;
        if ($r->hasFile('attachment')) {
            $stored = $r->file('attachment')->store('public/chat_attachments');
            $attachmentUrl = Storage::url($stored); // /storage/...
        }

        $msg = Message::create([
            'room_id'        => $conversation->id,
            'sender_id'      => $me,
            'message'        => $data['body'] ?? null,
            'attachment_url' => $attachmentUrl,
            'is_read'        => false,
            'created_at'     => now(),
        ]);

        $conversation->updated_at = now();
        $conversation->save();

        return response()->json(['data' => $msg], 201);
    }
}