<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class AdminProductsController extends Controller
{
    protected function transformProduct(Product $p): array
    {
        return [
            'id'              => $p->id,
            'coach_id'        => $p->coach_id,
            'title'           => $p->title,
            'slug'            => $p->slug,
            'description'     => $p->description,
            'price'           => $p->price,
            'currency'        => $p->currency,
            'type'            => $p->type,
            'gym_name'        => $p->gym_name,
            'gym_address'     => $p->gym_address,
            'duration_weeks'  => $p->duration_weeks,
            'sessions_per_week'=> $p->sessions_per_week,
            'access_days'     => $p->access_days,
            'includes_chat'   => $p->includes_chat,
            'includes_calls'  => $p->includes_calls,
            'level'           => $p->level,
            'thumbnail_url'   => $p->thumbnail_url,
            'sort_order'      => $p->sort_order,
            'is_active'       => $p->is_active,
            'metadata'        => $p->metadata,
            'created_at'      => $p->created_at,
            'updated_at'      => $p->updated_at,
        ];
    }

    public function index(Request $request)
    {
        $query = Product::query()->orderByDesc('id');

        if ($coachId = $request->query('coach_id')) {
            $query->where('coach_id', $coachId);
        }

        if (($active = $request->query('is_active')) !== null) {
            if ($active === '1' || $active === 'true') {
                $query->where('is_active', true);
            } elseif ($active === '0' || $active === 'false') {
                $query->where('is_active', false);
            }
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        $products = $query->limit(500)->get();

        return response()->json([
            'data' => $products->map(fn (Product $p) => $this->transformProduct($p)),
        ]);
    }

    public function show(int $id)
    {
        $product = Product::findOrFail($id);

        return response()->json(
            $this->transformProduct($product)
        );
    }

    public function update(Request $request, int $id)
    {
        $product = Product::findOrFail($id);

        $data = $request->validate([
            'title'          => 'sometimes|string|max:160',
            'slug'           => 'sometimes|string|max:180',
            'description'    => 'sometimes|nullable|string',
            'price'          => 'sometimes|numeric',
            'currency'       => 'sometimes|string|max:7',
            'type'           => 'sometimes|string|max:20',
            'gym_name'       => 'sometimes|nullable|string|max:255',
            'gym_address'    => 'sometimes|nullable|string|max:255',
            'duration_weeks' => 'sometimes|nullable|integer|min:0|max:520',
            'sessions_per_week' => 'sometimes|nullable|integer|min:0|max:21',
            'access_days'    => 'sometimes|nullable|integer|min:0|max:3650',
            'includes_chat'  => 'sometimes|boolean',
            'includes_calls' => 'sometimes|boolean',
            'level'          => 'sometimes|nullable|string|max:24',
            'thumbnail_url'  => 'sometimes|nullable|string|max:255',
            'sort_order'     => 'sometimes|nullable|integer',
            'is_active'      => 'sometimes|boolean',
            'metadata'       => 'sometimes|nullable',
        ]);

        unset($data['id'], $data['coach_id'], $data['created_at'], $data['updated_at']);

        $product->fill($data);
        $product->save();

        return response()->json(
            $this->transformProduct($product)
        );
    }
}