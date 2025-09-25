<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackFlag extends Model
{
    protected $fillable = [
        'log_id',
        'too_easy',
        'too_hard',
        'pain',
        'comments',
    ];

    protected $casts = [
        'too_easy' => 'array',
        'too_hard' => 'array',
        'pain'     => 'array',
    ];

    public function workoutLog(): BelongsTo
    {
        return $this->belongsTo(WorkoutLog::class, 'log_id');
    }
}