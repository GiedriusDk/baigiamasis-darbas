<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = ['product_id', 'coach_id'];
    protected $casts = [
        'product_id' => 'integer',
        'coach_id'   => 'integer',
    ];

    public function weeks()
    {
        return $this->hasMany(PlanWeek::class, 'plan_id');
    }

    public function product()
    {
        return $this->belongsTo(\App\Models\Product::class, 'product_id');
    }

    public function coach()
    {
        return $this->belongsTo(\App\Models\User::class, 'coach_id');
    }
}