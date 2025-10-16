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
        return $this->hasMany(PlanWeek::class)->orderBy('week_number');
    }

    public function days()
    {
        return $this->hasMany(PlanDay::class);
    }
}