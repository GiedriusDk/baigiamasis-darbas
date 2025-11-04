<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatStatus extends Model
{
    use HasFactory;

    protected $table = 'chat_status';

    protected $primaryKey = 'user_id';
    public $incrementing  = false;
    protected $keyType    = 'int';
    public $timestamps    = false;

    protected $fillable = [
        'user_id',
        'is_online',
        'last_seen_at',
    ];

    protected $casts = [
        'user_id'      => 'integer',
        'is_online'    => 'boolean',
        'last_seen_at' => 'datetime',
    ];
}