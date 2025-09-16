<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id',
        'sex','birth_date',
        'height_cm','weight_kg',
        'goal','activity_level',
        'sessions_per_week','available_minutes',
        'preferred_days','equipment','preferences',
        'injuries_note','avatar_path',
    ];

    protected $casts = [
        'birth_date'       => 'date',
        'preferred_days'   => 'array',
        'equipment'        => 'array',
        'preferences'      => 'array',
        'height_cm'        => 'integer',
        'sessions_per_week'=> 'integer',
        'available_minutes'=> 'integer',
        'weight_kg'        => 'decimal:2',
    ];
}