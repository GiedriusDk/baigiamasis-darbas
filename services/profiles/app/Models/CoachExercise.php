<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachExercise extends Model
{
  protected $fillable = [
    'user_id','title','description','equipment','primary_muscle','difficulty',
    'is_paid','tags','media_path','media_type','external_url','position',
    'catalog_id','imported_at',
  ];

  protected $casts = [
    'tags' => 'array',
    'is_paid' => 'boolean',
  ];

    protected $appends = ['media_url'];

    public function getMediaUrlAttribute(): ?string
    {
        if ($this->media_path) return $this->media_path;
        if ($this->external_url) return $this->external_url;
        return null;
    }
}