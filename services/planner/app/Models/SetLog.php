<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SetLog extends Model
{
    protected $fillable = [
        'log_id',
        'exercise_id',
        'set_index',
        'weight',
        'reps',
        'rpe',
    ];

    public function workoutLog(): BelongsTo
    {
        return $this->belongsTo(WorkoutLog::class, 'log_id');
    }
}