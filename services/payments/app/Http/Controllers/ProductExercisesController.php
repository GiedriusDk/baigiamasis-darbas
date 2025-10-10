<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductExercisesController extends Controller
{
    // Grąžina priskirtų pratimų ID sąrašą (pagal sort_order)
    public function index(Request $r, Product $product)
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        if ((int)$product->coach_id !== (int)($u['id'] ?? 0)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $ids = DB::table('product_exercise')
            ->where('product_id', $product->id)
            ->orderBy('sort_order')
            ->pluck('exercise_id');

        return response()->json(['data' => array_map('intval', $ids->all())]);
    }

    // Perrašo visą sąrašą ir eiliškumą
    public function update(Request $r, Product $product)
    {
        $u = (array) ($r->attributes->get('auth_user') ?? []);
        if ((int)$product->coach_id !== (int)($u['id'] ?? 0)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $r->validate([
            'ids'   => 'required|array',
            'ids.*' => 'integer|min:1',
        ]);

        $ids = array_values(array_unique($data['ids']));

        DB::transaction(function () use ($product, $ids) {
            DB::table('product_exercise')->where('product_id', $product->id)->delete();

            if (!empty($ids)) {
                $rows = [];
                foreach ($ids as $i => $eid) {
                    $rows[] = [
                        'product_id'   => $product->id,
                        'exercise_id'  => $eid,
                        'sort_order'   => $i,
                    ];
                }
                DB::table('product_exercise')->insert($rows);
            }
        });

        return response()->json(['data' => $ids]);
    }
}