<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $table = 'chat_messages';

    public $timestamps = false;
    const CREATED_AT = 'created_at';

    protected $fillable = [
        'room_id',
        'sender_id',
        'message',
        'attachment_url',
        'is_read',
        'created_at',
    ];

    protected $casts = [
        'room_id'    => 'integer',
        'sender_id'  => 'integer',
        'is_read'    => 'boolean',
        'created_at' => 'datetime',
    ];

    public function room()
    {
        return $this->belongsTo(Conversation::class, 'room_id');
    }

    public function scopeInRoom(Builder $q, int $roomId): Builder
    {
        return $q->where('room_id', $roomId);
    }
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}