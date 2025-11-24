<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plan extends Model
{
    protected $fillable = [
        'user_id','goal','sessions_per_week','start_date','weeks',
        'session_minutes','equipment','injuries','meta', 'source', 'solo_only',
    ];

    protected $casts = [
        'injuries' => 'array',
        'meta'     => 'array',
        'start_date' => 'date',
        'solo_only' => 'boolean',
    ];

    public function workouts(): HasMany
    {
        return $this->hasMany(Workout::class);
    }
}