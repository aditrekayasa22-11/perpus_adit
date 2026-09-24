<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Peminjaman extends Model
{
    /** Status yang mungkin pada satu record peminjaman. */
    public const STATUS_MENUNGGU = 'menunggu';
    public const STATUS_DIPINJAM = 'dipinjam';
    public const STATUS_DIKEMBALIKAN = 'dikembalikan';

    protected $table = 'peminjaman';

    protected $fillable = [
        'user_id',
        'buku_id',
        'status',
        'catatan',
        'tanggal_pinjam',
        'tanggal_kembali',
        'tanggal_pengembalian',
        'diproses_oleh',
    ];

    protected $casts = [
        'tanggal_pinjam'       => 'date:Y-m-d',
        'tanggal_kembali'      => 'date:Y-m-d',
        'tanggal_pengembalian' => 'date:Y-m-d',
    ];

    /** Siswa pemohon peminjaman. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Buku yang dipinjam. */
    public function buku(): BelongsTo
    {
        return $this->belongsTo(Buku::class);
    }

    /** Petugas/admin yang terakhir memproses pengajuan ini. */
    public function petugas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'diproses_oleh');
    }

    /** Serialisasi tanggal ringkas (Y-m-d) agar enak dibaca frontend. */
    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format('Y-m-d');
    }
}
