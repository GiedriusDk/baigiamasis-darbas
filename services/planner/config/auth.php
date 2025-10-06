<?php
return [
    'defaults' => [
        'guard' => 'api',
    ],
    'guards' => [
        'api' => [
            'driver' => 'token',
            'provider' => null,
        ],
    ],
    'providers' => [
    ],
];