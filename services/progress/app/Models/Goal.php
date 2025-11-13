<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Goal extends Model
{
    protected $table = 'progress_goals';

    protected $fillable = [
        'user_id',
        'metric_id',
        'title',
        'target_value',
        'target_date',
        'status',
    ];

    protected $casts = [
        'target_date' => 'date',
    ];

    public function metric()
    {
        return $this->belongsTo(ProgressMetric::class, 'metric_id');
    }

    public function checkins()
    {
        return $this->hasMany(ProgressGoalCheckin::class, 'goal_id');
    }
}