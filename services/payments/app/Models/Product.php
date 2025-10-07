<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'products';

    protected $fillable = [
        'coach_id',
        'title',
        'slug',
        'description',
        'price',
        'currency',
        'type',
        'gym_name',
        'gym_address',
        'duration_weeks',
        'sessions_per_week',
        'access_days',
        'includes_chat',
        'includes_calls',
        'level',
        'thumbnail_url',
        'sort_order',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'is_active' => 'bool',
        'sort_order' => 'int',
        'includes_chat' => 'bool',
        'includes_calls' => 'bool',
        'metadata' => 'array',
    ];
}