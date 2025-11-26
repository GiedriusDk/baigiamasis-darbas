<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlanDayExercise extends Model
{
    protected $fillable = [
        'plan_id','plan_day_id','exercise_id',
        'custom_title','custom_notes',
        'order','sets','reps','rest_seconds'
    ];

    protected $casts = [
        'plan_id'      => 'integer',
        'plan_day_id'  => 'integer',
        'exercise_id'  => 'integer',
        'order'        => 'integer',
        'sets'         => 'integer',
        'reps'         => 'integer',
        'rest_seconds' => 'integer',
    ];

    public function day()
    {
        return $this->belongsTo(PlanDay::class, 'plan_day_id');
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class, 'plan_id');
    }

    public function exercise()
    {
        return $this->belongsTo(\App\Models\CoachExercise::class, 'exercise_id');
    }
}