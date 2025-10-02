<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\Order;
use App\Models\Payment;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Sukuriam kelis produktus
        $p1 = Product::updateOrCreate(
            ['title' => 'Basic Coaching Plan (4 weeks)'],
            [
                'coach_id'    => 1,
                'description' => '4-week intro plan with weekly check-ins.',
                'price'       => 1999, // centais: 19.99 EUR
                'currency'    => 'EUR',
                'is_active'   => true,
                'metadata'    => json_encode(['weeks' => 4]),
            ]
        );

        $p2 = Product::updateOrCreate(
            ['title' => 'Premium Coaching Plan (12 weeks)'],
            [
                'coach_id'    => 1,
                'description' => '12-week premium plan with video calls.',
                'price'       => 4999, // 49.99 EUR
                'currency'    => 'EUR',
                'is_active'   => true,
                'metadata'    => json_encode(['weeks' => 12, 'features' => ['video_calls' => true]]),
            ]
        );

        // Sukuriam testinį orderį useriui #1
        $o1 = Order::create([
            'user_id'    => 1,
            'product_id' => $p1->id,
            'public_id'  => Str::uuid(),
            'amount'     => $p1->price,
            'currency'   => $p1->currency,
            'status'     => 'paid',
            'paid_at'    => now(),
            'metadata'   => json_encode(['note' => 'seed order']),
        ]);

        // Sukuriam apmokėjimą už orderį
        Payment::create([
            'order_id'        => $o1->id,
            'provider'        => 'stripe',
            'provider_txn_id' => 'txn_test_' . Str::random(8),
            'amount'          => $o1->amount,
            'currency'        => $o1->currency,
            'status'          => 'succeeded',
            'paid_at'         => now(),
            'raw_response'    => json_encode(['demo' => true, 'id' => 'txn_test']),
        ]);
    }
}