<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    protected function ensureOwner(Request $r, Plan $plan)
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        abort_if((int)($u['id'] ?? 0) !== (int)$plan->coach_id, 403, 'Forbidden');
    }

    public function index(Request $r)
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        $coachId = (int)($u['id'] ?? 0);

        return response()->json([
            'data' => Plan::query()
                ->where('coach_id', $coachId)
                ->orderByDesc('id')
                ->get(['id','product_id','coach_id','title','is_active','created_at','updated_at']),
        ]);
    }

    public function show(Request $r, Plan $plan)
    {
        $this->ensureOwner($r, $plan);

        $plan->load([
            'weeks' => function ($q) {
                $q->orderBy('week_number')
                  ->with(['days' => function ($q2) {
                      $q2->orderBy('day_number');
                  }]);
            },
        ]);

        return response()->json(['data' => $plan]);
    }

    public function store(Request $r)
    {
        $u = (array)($r->attributes->get('auth_user') ?? []);
        $coachId = (int)($u['id'] ?? 0);

        $data = $r->validate([
            'product_id' => 'required|integer|min:1',
            'title'      => 'nullable|string|max:255',
            'is_active'  => 'boolean',
        ]);

        $plan = Plan::create([
            'product_id' => $data['product_id'],
            'coach_id'   => $coachId,
            'title'      => $data['title'] ?? 'Plan',
            'is_active'  => $data['is_active'] ?? true,
        ]);

        return response()->json(['data' => $plan], 201);
    }

    public function update(Request $r, Plan $plan)
    {
        $this->ensureOwner($r, $plan);

        $data = $r->validate([
            'title'     => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $plan->fill($data)->save();

        return response()->json(['data' => $plan]);
    }

    public function destroy(Request $r, Plan $plan)
    {
        $this->ensureOwner($r, $plan);
        $plan->delete();
        return response()->json(['data' => true]);
    }
}