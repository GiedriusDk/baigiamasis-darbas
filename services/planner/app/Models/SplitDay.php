<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SplitDay extends Model
{
    protected $fillable = ['split_id','day_index','name'];

    public function split() {
        return $this->belongsTo(Split::class);
    }

    public function slots() {
        return $this->hasMany(SplitSlot::class);
    }
}