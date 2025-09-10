<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachExercise extends Model
{
    protected $fillable = [
        'user_id', 'title', 'description',
        'equipment', 'primary_muscle', 'difficulty',
        'tags', 'media_path', 'media_type', 'external_url',
        'position'
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    // Patogumui – galutinis laukas, kurį rodysim fronte
    protected $appends = ['media_url'];

    public function getMediaUrlAttribute(): ?string
    {
        if ($this->media_path) return $this->media_path;   // /storage/... (vietinis)
        if ($this->external_url) return $this->external_url; // youtube/gif/kt.
        return null;
    }
}