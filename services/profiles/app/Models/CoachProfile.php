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
        'country',
        'experience_years',
        'specializations',
        'availability_note',
        'socials',
        'avatar_path',
        'timezone',
        'languages',
        'certifications',
        'phone',
        'website_url',
    ];

    protected $casts = [
        'specializations'   => 'array',
        'socials'           => 'array',
        'languages'         => 'array',
        'certifications'    => 'array',
        'experience_years'  => 'integer',
    ];
}