<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PlanDayExercisesController extends Controller
{
    public function index(Request $r, int $productId, int $dayId)
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        $plan = Plan::where('product_id', $productId)->first();
        if (!$plan) {
            return response()->json(['data' => []]);
        }
        if ((int)$plan->coach_id !== (int)($u['id'] ?? 0)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $belongs = DB::table('plan_days')
            ->join('plan_weeks', 'plan_weeks.id', '=', 'plan_days.plan_week_id')
            ->where('plan_days.id', $dayId)
            ->where('plan_weeks.plan_id', $plan->id)
            ->exists();

        if (!$belongs) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $rows = DB::table('plan_day_exercises')
            ->where('plan_id', $plan->id)
            ->where('plan_day_id', $dayId)
            ->orderBy('order')
            ->get([
                'id',
                'exercise_id',
                'custom_title',
                'custom_notes',
                'order',
                'sets',
                'reps',
                'rest_seconds',
            ]);

        return response()->json(['data' => $rows]);
    }

    public function update(Request $r, int $productId, int $dayId)
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        $plan = Plan::where('product_id', $productId)->first();
        if (!$plan) {
            return response()->json(['message' => 'Not found'], 404);
        }
        if ((int)$plan->coach_id !== (int)($u['id'] ?? 0)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $belongs = DB::table('plan_days')
            ->join('plan_weeks', 'plan_weeks.id', '=', 'plan_days.plan_week_id')
            ->where('plan_days.id', $dayId)
            ->where('plan_weeks.plan_id', $plan->id)
            ->exists();

        if (!$belongs) {
            return response()->json(['message' => 'Not found'], 404);
        }

        $data = $r->validate([
            'items'                    => 'required|array',
            'items.*.exercise_id'      => 'nullable|integer|min:1',
            'items.*.custom_title'     => 'nullable|string|max:255',
            'items.*.custom_notes'     => 'nullable|string',
            'items.*.order'            => 'nullable|integer|min:0',
            'items.*.sets'             => 'nullable|integer|min:0',
            'items.*.reps'             => 'nullable|integer|min:0',
            'items.*.rest_seconds'     => 'nullable|integer|min:0',
        ]);

        $items = array_values($data['items'] ?? []);

        DB::transaction(function () use ($plan, $dayId, $items) {
            DB::table('plan_day_exercises')
                ->where('plan_id', $plan->id)
                ->where('plan_day_id', $dayId)
                ->delete();

            if (!$items) {
                return;
            }

            $now = now();
            $rows = [];
            foreach ($items as $i => $it) {
                $rows[] = [
                    'plan_id'       => $plan->id,
                    'plan_day_id'   => $dayId,
                    'exercise_id'   => isset($it['exercise_id']) ? (int)$it['exercise_id'] : null,
                    'custom_title'  => $it['custom_title'] ?? null,
                    'custom_notes'  => $it['custom_notes'] ?? null,
                    'order'         => isset($it['order']) ? (int)$it['order'] : $i,
                    'sets'          => isset($it['sets']) ? (int)$it['sets'] : null,
                    'reps'          => isset($it['reps']) ? (int)$it['reps'] : null,
                    'rest_seconds'  => isset($it['rest_seconds']) ? (int)$it['rest_seconds'] : null,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ];
            }

            DB::table('plan_day_exercises')->insert($rows);
        });

        $out = DB::table('plan_day_exercises')
            ->where('plan_id', $plan->id)
            ->where('plan_day_id', $dayId)
            ->orderBy('order')
            ->get([
                'id',
                'exercise_id',
                'custom_title',
                'custom_notes',
                'order',
                'sets',
                'reps',
                'rest_seconds',
            ]);

        return response()->json(['data' => $out]);
    }

    public function publicIndex(int $productId, int $dayId)
    {
        $plan = Plan::where('product_id', $productId)->first();
        if (!$plan) {
            return response()->json(['data' => []]);
        }

        $belongs = DB::table('plan_days')
            ->join('plan_weeks', 'plan_weeks.id', '=', 'plan_days.plan_week_id')
            ->where('plan_days.id', $dayId)
            ->where('plan_weeks.plan_id', $plan->id)
            ->exists();

        if (!$belongs) {
            return response()->json(['data' => []]);
        }

        $rows = DB::table('plan_day_exercises')
            ->where('plan_id', $plan->id)
            ->where('plan_day_id', $dayId)
            ->orderBy('order')
            ->get([
                'id',
                'exercise_id',
                'custom_title',
                'custom_notes',
                'order',
                'sets',
                'reps',
                'rest_seconds',
            ]);

        return response()->json(['data' => $rows]);
    }
}