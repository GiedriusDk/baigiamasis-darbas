<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\Product;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function showByProduct(Request $request, $productId)
    {
        $user = $request->user();
        $plan = Plan::query()
            ->where('product_id', $productId)
            ->where('coach_id', $user->id)
            ->first();

        if (!$plan) {

            $plan = Plan::create([
                'product_id' => $productId,
                'coach_id'   => $user->id,
                'title'      => 'Plan',
            ]);
        }

        $weeks = $plan->weeks()->orderBy('week_number')->get();
        $days  = $plan->days()->orderBy('week_number')->orderBy('day_number')->get();

        return response()->json([
            'plan'  => $plan,
            'weeks' => $weeks,
            'days'  => $days,
        ]);
    }

    public function publicShow($productId)
    {
        $plan = Plan::query()->where('product_id', $productId)->first();

        if (!$plan) {
            return response()->json(['message' => 'Plan not found'], 404);
        }

        $weeks = $plan->weeks()->orderBy('week_number')->get(['id','plan_id','week_number','title']);
        $days  = $plan->days()
            ->orderBy('week_number')->orderBy('day_number')
            ->get(['id','plan_id','plan_week_id','week_number','day_number','title','notes']);

        return response()->json([
            'plan'  => [
                'id'         => $plan->id,
                'product_id' => $plan->product_id,
                'coach_id'   => $plan->coach_id,
                'title'      => $plan->title,
            ],
            'weeks' => $weeks,
            'days'  => $days,
        ]);
    }
}