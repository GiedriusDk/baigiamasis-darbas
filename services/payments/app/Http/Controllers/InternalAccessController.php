<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InternalAccessController extends Controller
{
    public function canChat(Request $r)
    {
        $userId  = (int) $r->query('user_id');
        $coachId = (int) $r->query('coach_id');
        if (!$userId || !$coachId) {
            return response()->json(['ok' => false, 'reason' => 'bad_params'], 422);
        }

        $row = DB::table('orders as o')
            ->join('products as p', 'p.id', '=', 'o.product_id')
            ->where('o.user_id', $userId)
            ->where('o.status', 'paid')
            ->where(function ($q) { $q->whereNull('o.expires_at')->orWhere('o.expires_at', '>', now()); })
            ->where('p.coach_id', $coachId)
            ->selectRaw('count(*) as cnt')
            ->first();

        return response()->json(['ok' => $row && (int)$row->cnt > 0]);
    }

    public function ownedCoaches(Request $r)
    {
        $u = $r->user();
        if (!$u) return response()->json(['data' => []], 200);

        $ids = DB::table('orders as o')
            ->join('products as p', 'p.id', '=', 'o.product_id')
            ->where('o.user_id', $u->id)
            ->where('o.status', 'paid')
            ->where(function ($q) {
                $q->whereNull('o.expires_at')->orWhere('o.expires_at', '>', now());
            })
            ->pluck('p.coach_id')->unique()->values();

        return response()->json(['data' => $ids]);
    }
}