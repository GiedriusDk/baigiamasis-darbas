<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkoutLog extends Model
{
    protected $fillable = [
        'user_id',
        'workout_id',
        'date',
        'duration_min',
        'rpe_session',
        'notes',
    ];

    public function workout(): BelongsTo
    {
        return $this->belongsTo(Workout::class);
    }

    public function sets(): HasMany
    {
        return $this->hasMany(SetLog::class, 'log_id');
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(FeedbackFlag::class, 'log_id');
    }
}