<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Metric extends Model
{
    protected $table = 'progress_metrics';
    protected $fillable = ['user_id','slug','name','unit','kind','is_public'];
    protected $casts = ['is_public' => 'boolean'];

    public function entries(): HasMany
    {
        return $this->hasMany(Entry::class, 'metric_id');
    }

    public function latestEntry(): HasOne
    {
        return $this->hasOne(Entry::class, 'metric_id')->latestOfMany('date');
    }
}