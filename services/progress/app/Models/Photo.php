<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    protected $table = 'progress_photos';

    protected $fillable = [
        'user_id',
        'entry_id',
        'path',
        'width',
        'height',
        'pose',
        'taken_at',
    ];

    protected $casts = [
        'taken_at' => 'datetime',
    ];

    public function entry()
    {
        return $this->belongsTo(ProgressEntry::class, 'entry_id');
    }
}