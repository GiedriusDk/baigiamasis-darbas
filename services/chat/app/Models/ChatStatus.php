<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatStatus extends Model
{
    protected $table = 'chat_status';
    protected $primaryKey = 'user_id';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = ['user_id', 'is_online', 'last_seen_at'];
    protected $casts = [
        'is_online'    => 'bool',
        'last_seen_at' => 'datetime',
    ];
}