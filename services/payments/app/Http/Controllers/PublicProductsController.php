<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PublicProductsController extends Controller
{
    public function show($id)
    {
        $p = DB::table('products')->where('id', $id)->first();
        if (!$p) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json([
            'id'          => $p->id,
            'coach_id'    => $p->coach_id,
            'title'       => $p->title,
            'description' => $p->description,
            'price'       => $p->price,
            'currency'    => $p->currency,
        ]);
    }
}