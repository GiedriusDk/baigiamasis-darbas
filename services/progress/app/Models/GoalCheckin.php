<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoalCheckin extends Model
{
    protected $table = 'progress_goal_checkins';

    protected $fillable = [
        'goal_id',
        'user_id',
        'entry_id',
        'achieved',
        'note',
    ];

    protected $casts = [
        'achieved' => 'boolean',
    ];

    public function goal()
    {
        return $this->belongsTo(ProgressGoal::class, 'goal_id');
    }

    public function entry()
    {
        return $this->belongsTo(ProgressEntry::class, 'entry_id');
    }
}