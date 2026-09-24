<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Pesan Validasi Bahasa Indonesia
    |--------------------------------------------------------------------------
    | Hanya kunci yang dipakai aplikasi ini yang didefinisikan. Kunci lain
    | otomatis diambil dari bahasa fallback (en).
    |
    */

    'accepted' => ':attribute harus diterima.',

    'after_or_equal'     => ':attribute harus tanggal setelah atau sama dengan :date.',
    'before_or_equal'    => ':attribute harus tanggal sebelum atau sama dengan :date.',
    'date_equals'        => ':attribute harus tanggal yang sama dengan :date.',

    'alpha'       => ':attribute hanya boleh berisi huruf.',
    'alpha_num'   => ':attribute hanya boleh berisi huruf dan angka.',
    'alpha_dash'  => ':attribute hanya boleh berisi huruf, angka, dan tanda hubung.',
    'array'       => ':attribute harus berupa array.',

    'boolean' => ':attribute harus bernilai true atau false.',

    'confirmed'        => ':attribute konfirmasi tidak cocok.',
    'different'        => ':attribute dan :other harus berbeda.',
    'ends_with'        => ':attribute harus berakhiran salah satu dari: :values.',
    'exists'           => ':attribute yang dipilih tidak valid.',
    'file'             => ':attribute harus berupa file.',
    'filled'           => ':attribute wajib diisi.',
    'image'            => ':attribute harus berupa gambar.',
    'in'               => ':attribute yang dipilih tidak valid.',
    'integer'          => ':attribute harus berupa bilangan bulat.',
    'max'              => [
        'numeric' => ':attribute tidak boleh lebih besar dari :max.',
        'file'    => ':attribute tidak boleh lebih besar dari :max kilobyte.',
        'string'  => ':attribute tidak boleh lebih panjang dari :max karakter.',
        'array'   => ':attribute tidak boleh memiliki lebih dari :max item.',
    ],
    'max_digits'       => ':attribute tidak boleh lebih dari :max digit.',
    'mimes'            => ':attribute harus berupa file dengan tipe: :values.',
    'mimetypes'        => ':attribute harus berupa file dengan tipe: :values.',
    'min'              => [
        'numeric' => ':attribute harus minimal :min.',
        'file'    => ':attribute minimal :min kilobyte.',
        'string'  => ':attribute minimal :min karakter.',
        'array'   => ':attribute minimal :min item.',
    ],
    'min_digits'       => ':attribute minimal :min digit.',
    'not_in'           => ':attribute yang dipilih tidak valid.',
    'numeric'          => ':attribute harus berupa angka.',
    'present'          => ':attribute wajib ada.',
    'regex'            => ':attribute tidak sesuai format yang diizinkan.',
    'required'         => 'Field :attribute wajib diisi.',
    'required_if'      => ':attribute wajib diisi ketika :other adalah :value.',
    'same'             => ':attribute dan :other harus sama.',
    'starts_with'      => ':attribute harus diawali salah satu dari: :values.',
    'string'           => ':attribute harus berupa teks.',
    'unique'           => ':attribute sudah digunakan.',
    'url'              => ':attribute tidak berupa URL yang valid.',

    'after'       => ':attribute harus tanggal setelah :date.',
    'before'      => ':attribute harus tanggal sebelum :date.',
    'date'        => ':attribute bukan tanggal yang valid.',
    'date_format' => ':attribute tidak cocok dengan format :format.',
    'email'       => ':attribute harus berupa alamat email yang valid.',
    'in_array'    => ':field harus salah satu dari: :values.',
    'max.date'    => ':attribute tidak boleh tanggal setelah :max.',
    'min.date'    => ':attribute harus tanggal minimal :min.',

    'between' => [
        'numeric' => ':attribute harus antara :min dan :max.',
        'file'    => ':attribute harus antara :min dan :max kilobyte.',
        'string'  => ':attribute harus antara :min dan :max karakter.',
        'array'   => ':attribute harus antara :min dan :max item.',
    ],

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'pesan-kustom',
        ],
    ],

    'attributes' => [
        'kode_buku'    => 'kode buku',
        'judul'        => 'judul',
        'penulis'      => 'penulis',
        'kategori'     => 'kategori',
        'tahun_terbit' => 'tahun terbit',
        'penerbit'     => 'penerbit',
        'cover'        => 'sampul',
        'username'     => 'username',
        'password'     => 'password',
        'name'         => 'nama',
        'email'        => 'email',
    ],

];
