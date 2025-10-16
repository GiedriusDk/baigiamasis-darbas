<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanDay extends Model
{
    protected $fillable = ['plan_id', 'plan_week_id', 'day_number', 'title', 'notes'];
    protected $casts = [
        'plan_id'      => 'integer',
        'plan_week_id' => 'integer',
        'day_number'   => 'integer',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function week()
    {
        return $this->belongsTo(PlanWeek::class, 'plan_week_id');
    }

    public function exercises()
    {
        return $this->hasMany(PlanDayExercise::class)->orderBy('order');
    }
}