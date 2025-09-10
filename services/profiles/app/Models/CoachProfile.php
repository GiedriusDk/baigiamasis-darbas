<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachProfile extends Model
{
    protected $table = 'coach_profiles';

    protected $fillable = [
            'user_id',
            'bio',
            'city',
            'experience_years',
            'price_per_session',
            'specializations',
            'availability_note',
            'avatar_path',
        ];

    protected $casts = [
        'specializations'  => 'array',
        'experience_years' => 'integer',
        'price_per_session'=> 'integer',
    ];
}