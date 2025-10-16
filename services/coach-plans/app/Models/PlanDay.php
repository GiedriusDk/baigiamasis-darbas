<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanDay extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_week_id',
        'day_number',
        'title',
        'notes',
    ];

    public function week()
    {
        return $this->belongsTo(PlanWeek::class);
    }

    public function exercises()
    {
        return $this->hasMany(PlanDayExercise::class);
    }
}