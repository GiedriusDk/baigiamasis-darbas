<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    use HasFactory;

    protected $table = 'chat_rooms';

    protected $fillable = ['coach_id', 'user_id', 'plan_id'];

    protected $casts = [
        'coach_id' => 'integer',
        'user_id'  => 'integer',
        'plan_id'  => 'integer',
    ];

    public function messages()
    {
        return $this->hasMany(Message::class, 'room_id');
    }

    public function scopeForUser(Builder $q, int $userId): Builder
    {
        return $q->where('coach_id', $userId)->orWhere('user_id', $userId);
    }

    public function scopeBetween(Builder $q, int $a, int $b): Builder
    {
        return $q->where(function ($w) use ($a, $b) {
            $w->where('coach_id', $a)->where('user_id', $b);
        })->orWhere(function ($w) use ($a, $b) {
            $w->where('coach_id', $b)->where('user_id', $a);
        });
    }
}