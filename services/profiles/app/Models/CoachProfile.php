<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class CoachProfile extends Model
{
    protected $table = 'coach_profiles';

    protected $fillable = [
        'user_id', 'bio', 'city', 'country', 'timezone', 'experience_years',
        'availability_note', 'specializations', 'languages', 'certifications',
        'phone', 'website_url', 'socials', 'gym_name', 'gym_address', 'avatar_path',
    ];

    protected $casts = [
        'specializations' => 'array',
        'languages'       => 'array',
        'certifications'  => 'array',
        'socials'         => 'array',
    ];

        public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}