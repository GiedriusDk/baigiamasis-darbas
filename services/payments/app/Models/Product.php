<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Product extends Model
{
    protected $table = 'products';

    protected $fillable = [
        'coach_id','title','slug','description','price','currency','type',
        'gym_name','gym_address','duration_weeks','sessions_per_week','access_days',
        'includes_chat','includes_calls','level','thumbnail_url','sort_order',
        'is_active','metadata',
    ];

    protected $casts = [
        'is_active' => 'bool',
        'sort_order' => 'int',
        'includes_chat' => 'bool',
        'includes_calls' => 'bool',
        'metadata' => 'array',
    ];

    public function exerciseIds(): array
    {
        return DB::table('product_exercise')
            ->where('product_id', $this->id)
            ->orderBy('sort_order')
            ->pluck('exercise_id')
            ->map(fn ($v) => (int) $v)
            ->all();
    }
}