<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $table = 'user_profiles';

    protected $fillable = [
        'user_id',
        'city',
        'sex',
        'birth_date',
        'height_cm',
        'weight_kg',
        'goal',
        'activity_level',
        'sessions_per_week',
        'available_minutes',
        'preferred_days',
        'equipment',
        'preferences',
        'injuries',
        'avatar_path',
    ];

    protected $casts = [
        'birth_date'        => 'date',
        'sessions_per_week' => 'integer',
        'available_minutes' => 'integer',
        'height_cm'         => 'integer',
        'weight_kg'         => 'decimal:2',
        'preferred_days'    => 'array',
        'equipment'         => 'array',
        'injuries'         => 'array',
        'preferences'       => 'array',
    ];
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}