<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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

        $base = rtrim(config('services.payments.base'), '/');
        $product = null;
        try {
            $resp = Http::timeout(3)->get("{$base}/public/products/{$plan->product_id}");
            if ($resp->ok()) $product = $resp->json();
        } catch (\Throwable $e) {
            $product = null;
        }

        $title = $product['title'] ?? $plan->title ?? "Plan #{$plan->id}";
        $description = $product['description'] ?? null;

        return response()->json([
            'plan'  => [
                'id'          => $plan->id,
                'product_id'  => $plan->product_id,
                'coach_id'    => $plan->coach_id,
                'title'       => $title,
                'description' => $description,
            ],
            'weeks' => $weeks,
            'days'  => $days,
        ]);
    }
}