<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Frontend React berjalan di http://localhost:5173 sehingga domain tersebut
    | diizinkan mengakses API Laravel yang berjalan di http://localhost:8000.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:4173',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => false,

];
