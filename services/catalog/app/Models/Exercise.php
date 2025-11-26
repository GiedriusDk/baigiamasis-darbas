<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exercise extends Model
{
    protected $table = 'exercises';

    protected $guarded = [];

    protected $casts = [
        'tags'              => 'array',
        'body_parts'        => 'array',
        'target_muscles'    => 'array',
        'secondary_muscles' => 'array',
        'equipments_j'      => 'array',
        'instructions'      => 'array',
        'keywords'          => 'array',
    ];

    public $timestamps = true;
}