<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $table = 'payments';

    protected $fillable = [
        'order_id',
        'provider',
        'provider_txn_id',
        'amount',
        'currency',
        'status',      // initiated|succeeded|failed|refunded
        'paid_at',
        'raw_response',
    ];

    protected $casts = [
        'paid_at'      => 'datetime',
        'raw_response' => 'array',
    ];
}