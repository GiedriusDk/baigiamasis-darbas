<?php
return [
    'defaults' => [
        'guard' => 'api',
    ],
    'guards' => [
        'api' => [
            // driver nesvarbus, nes auth daro middleware,
            // bet, kad Laravel nepyktų, gali palikti 'token'
            'driver' => 'token',
            'provider' => null,
        ],
    ],
    'providers' => [
        // nereikia user provider’io iš auth_db
    ],
];