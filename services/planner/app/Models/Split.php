<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Split extends Model
{
    protected $fillable = ['goal','sessions_per_week','slug','meta'];

    protected $casts = [
        'meta' => 'array',
    ];

    public function days() {
        return $this->hasMany(SplitDay::class)->orderBy('day_index');
    }
}