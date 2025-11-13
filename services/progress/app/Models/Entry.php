<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Entry extends Model
{
    protected $table = 'progress_entries';

    protected $fillable = [
        'user_id',
        'metric_id',
        'date',
        'value',
        'value_json',
        'note',
        'recorded_at',
        'source',
    ];

    protected $casts = [
        'date' => 'date',
        'recorded_at' => 'datetime',
        'value_json' => 'array',
        'value' => 'float',
    ];

    public function photos()
    {
        return $this->hasMany(Photo::class);
    }
}