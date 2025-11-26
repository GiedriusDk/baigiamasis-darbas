<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;

class AdminChatMessageController extends Controller
{
    protected function transformMessage(Message $m): array
    {
        return [
            'id'             => $m->id,
            'room_id'        => $m->room_id,
            'sender_id'      => $m->sender_id,
            'message'        => $m->message,
            'attachment_url' => $m->attachment_url,
            'is_read'        => (bool) $m->is_read,
            'created_at'     => $m->created_at,
        ];
    }

    public function index(Request $request)
    {
        $query = Message::query()->orderBy('id', 'desc');

        if ($roomId = $request->query('room_id')) {
            $query->where('room_id', $roomId);
        }
        if ($senderId = $request->query('sender_id')) {
            $query->where('sender_id', $senderId);
        }
        if (!is_null($request->query('is_read'))) {
            $isRead = filter_var($request->query('is_read'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
            if (!is_null($isRead)) {
                $query->where('is_read', $isRead);
            }
        }

        $messages = $query->get();

        return response()->json([
            'data' => $messages->map(fn (Message $m) => $this->transformMessage($m)),
        ]);
    }

    public function show(int $id)
    {
        $message = Message::findOrFail($id);

        return response()->json(
            $this->transformMessage($message)
        );
    }

    public function update(Request $request, int $id)
    {
        $message = Message::findOrFail($id);

        $data = $request->validate([
            'message'        => 'nullable|string',
            'attachment_url' => 'nullable|string|max:1000',
            'is_read'        => 'nullable|boolean',
        ]);

        unset($data['id'], $data['room_id'], $data['sender_id'], $data['created_at']);

        $message->fill($data);
        $message->save();

        return response()->json(
            $this->transformMessage($message)
        );
    }

    public function destroy(int $id)
    {
        $message = Message::findOrFail($id);
        $message->delete();

        return response()->json([
            'message' => 'Chat message deleted',
        ]);
    }
}