<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Buku extends Model
{
    /** @use HasFactory<\Database\Factories\BukuFactory> */
    // use HasFactory; // diaktifkan bila factory dibutuhkan

    protected $table = 'buku';

    protected $fillable = [
        'kode_buku',
        'judul',
        'penulis',
        'kategori',
        'tahun_terbit',
        'penerbit',
        'cover',
    ];

    protected $casts = [
        'tahun_terbit' => 'integer',
    ];
}
