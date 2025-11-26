<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use Illuminate\Http\Request;

class AdminChatRoomController extends Controller
{
    protected function transformRoom(Conversation $room): array
    {
        return [
            'id'         => $room->id,
            'coach_id'   => $room->coach_id,
            'user_id'    => $room->user_id,
            'plan_id'    => $room->plan_id,
            'type'       => $room->type,
            'title'      => $room->title,
            'slug'       => $room->slug,
            'created_at' => $room->created_at,
            'updated_at' => $room->updated_at,
        ];
    }

    public function index(Request $request)
    {
        $query = Conversation::query()->orderBy('id', 'desc');

        if ($coachId = $request->query('coach_id')) {
            $query->where('coach_id', $coachId);
        }
        if ($userId = $request->query('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($planId = $request->query('plan_id')) {
            $query->where('plan_id', $planId);
        }
        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        $rooms = $query->get();

        return response()->json([
            'data' => $rooms->map(fn (Conversation $room) => $this->transformRoom($room)),
        ]);
    }

    public function show(int $id)
    {
        $room = Conversation::findOrFail($id);

        return response()->json(
            $this->transformRoom($room)
        );
    }

    public function update(Request $request, int $id)
    {
        $room = Conversation::findOrFail($id);

        $data = $request->validate([
            'type'  => 'nullable|string|max:255',
            'title' => 'nullable|string|max:255',
            'slug'  => 'nullable|string|max:255',
        ]);

        unset($data['id'], $data['created_at'], $data['updated_at'],
            $data['coach_id'], $data['user_id'], $data['plan_id']);

        $room->fill($data);
        $room->save();

        return response()->json(
            $this->transformRoom($room)
        );
    }

    public function destroy(int $id)
    {
        $room = Conversation::findOrFail($id);
        $room->delete();

        return response()->json([
            'message' => 'Chat room deleted',
        ]);
    }
}