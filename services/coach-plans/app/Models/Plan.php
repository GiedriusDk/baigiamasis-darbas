<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'coach_id',
        'title',
        'description',
        'is_active',
    ];

    public function weeks()
    {
        return $this->hasMany(PlanWeek::class);
    }

    public function days()
    {
        return $this->hasManyThrough(PlanDay::class, PlanWeek::class);
    }

    public function exercises()
    {
        return $this->hasMany(PlanDayExercise::class);
    }
}