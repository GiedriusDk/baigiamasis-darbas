<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CoachProfile extends Model
{
    protected $table = 'coach_profiles';

    protected $fillable = [
        'user_id', 'bio', 'city', 'country', 'timezone', 'experience_years',
        'availability_note', 'specializations', 'languages', 'certifications',
        'phone', 'website_url', 'socials', 'gym_name', 'gym_address'
    ];

    protected $casts = [
        'specializations' => 'array',
        'languages'       => 'array',
        'certifications'  => 'array',
        'socials'         => 'array',
    ];
}