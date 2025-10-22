<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanWeek extends Model
{
    protected $fillable = ['plan_id','week_number','title','notes'];
    protected $casts = [
        'plan_id'     => 'integer',
        'week_number' => 'integer',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function days()
    {
        return $this->hasMany(PlanDay::class)->orderBy('day_number');
    }
}