<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanDayExercise extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_id',
        'plan_day_id',
        'exercise_id',
        'custom_title',
        'custom_notes',
        'order',
        'sets',
        'reps',
        'rest_seconds',
    ];

    public function day()
    {
        return $this->belongsTo(PlanDay::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
}