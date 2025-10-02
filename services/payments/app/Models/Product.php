<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';

    protected $fillable = [
        'coach_id',
        'title',
        'description',
        'price',       // centais
        'currency',    // 'EUR'
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'bool',
        'metadata'  => 'array',
    ];
}