<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SplitSlot extends Model
{
    protected $fillable = ['split_day_id','tag','count','min_compound'];

    public function day() {
        return $this->belongsTo(SplitDay::class, 'split_day_id');
    }
}