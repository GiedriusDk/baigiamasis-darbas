<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    protected $table = 'orders';

    protected $fillable = [
        'user_id',
        'product_id',
        'public_id',
        'amount',      // centais
        'currency',    // 'EUR'
        'status',      // pending|paid|cancelled|refunded
        'paid_at',
        'expires_at',
        'metadata',
    ];

    protected $casts = [
        'paid_at'    => 'datetime',
        'expires_at' => 'datetime',
        'metadata'   => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (Order $o) {
            if (empty($o->public_id)) {
                $o->public_id = (string) Str::uuid();
            }
            if (empty($o->status)) {
                $o->status = 'pending';
            }
            if (empty($o->currency)) {
                $o->currency = 'EUR';
            }
        });
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}