<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlanWeek extends Model
{
    use HasFactory;

    protected $fillable = [
        'plan_id',
        'week_number',
        'title',
    ];

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    public function days()
    {
        return $this->hasMany(PlanDay::class);
    }
}