<?php

namespace Database\Seeders;

use App\Models\Buku;
use App\Models\Peminjaman;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ---------- ADMIN ----------
        // username: admin | password: admin123
        User::updateOrCreate(
            ['username' => 'admin'],
            [
                'name'     => 'Administrator',
                'email'    => 'admin@perpus.test',
                'password' => Hash::make('admin123'),
                'role'     => 'admin',
            ]
        );

        // ---------- PETUGAS ----------
        // username: petugas | password: petugas123
        User::updateOrCreate(
            ['username' => 'petugas'],
            [
                'name'     => 'Petugas Perpustakaan',
                'email'    => 'petugas@perpus.test',
                'password' => Hash::make('petugas123'),
                'role'     => 'petugas',
            ]
        );

        // ---------- SISWA ----------
        // username: siswa | password: siswa123
        $siswa = User::updateOrCreate(
            ['username' => 'siswa'],
            [
                'name'     => 'Siswa Contoh',
                'email'    => 'siswa@perpus.test',
                'password' => Hash::make('siswa123'),
                'role'     => 'siswa',
            ]
        );

        $siswa2 = User::updateOrCreate(
            ['username' => 'siswa2'],
            [
                'name'     => 'Budi Santoso',
                'email'    => 'siswa2@perpus.test',
                'password' => Hash::make('siswa123'),
                'role'     => 'siswa',
            ]
        );

        // ---------- DATA BUKU (minimal 10) ----------
        $buku = [
            ['kode_buku' => 'BK001', 'judul' => 'Laskar Pelangi',         'penulis' => 'Andrea Hirata',      'kategori' => 'Novel',      'tahun_terbit' => 2005, 'penerbit' => 'Bentang Pustaka'],
            ['kode_buku' => 'BK002', 'judul' => 'Bumi',                   'penulis' => 'Tere Liye',          'kategori' => 'Novel',      'tahun_terbit' => 2014, 'penerbit' => 'Gramedia'],
            ['kode_buku' => 'BK003', 'judul' => 'Pemrograman PHP',        'penulis' => 'Abdul Kadir',        'kategori' => 'Teknologi',  'tahun_terbit' => 2020, 'penerbit' => 'Andi'],
            ['kode_buku' => 'BK004', 'judul' => 'Belajar HTML dan CSS',   'penulis' => 'Jubilee Enterprise', 'kategori' => 'Teknologi',  'tahun_terbit' => 2021, 'penerbit' => 'Elex Media Komputindo'],
            ['kode_buku' => 'BK005', 'judul' => 'Dasar-Dasar JavaScript', 'penulis' => 'Wahana Komputer',    'kategori' => 'Teknologi',  'tahun_terbit' => 2022, 'penerbit' => 'Andi'],
            ['kode_buku' => 'BK006', 'judul' => 'Negeri 5 Menara',        'penulis' => 'Ahmad Fuadi',        'kategori' => 'Novel',      'tahun_terbit' => 2009, 'penerbit' => 'Grasindo'],
            ['kode_buku' => 'BK007', 'judul' => 'Sapiens: Ringkasan Buku','penulis' => 'Yuval Noah Harari',  'kategori' => 'Sejarah',    'tahun_terbit' => 2017, 'penerbit' => 'Kanisius'],
            ['kode_buku' => 'BK008', 'judul' => 'Filosofi Teras',         'penulis' => 'Henry Manampiring',  'kategori' => 'Filsafat',   'tahun_terbit' => 2018, 'penerbit' => 'Kompas'],
            ['kode_buku' => 'BK009', 'judul' => 'Atomic Habits',          'penulis' => 'James Clear',        'kategori' => 'Pengembangan Diri', 'tahun_terbit' => 2018, 'penerbit' => 'Gramedia Pustaka Utama'],
            ['kode_buku' => 'BK010', 'judul' => 'Matematika Dasar',       'penulis' => 'Suryadi Ismail',     'kategori' => 'Pendidikan', 'tahun_terbit' => 2016, 'penerbit' => 'Erlangga'],
            ['kode_buku' => 'BK011', 'judul' => 'Pemrograman Python',     'penulis' => 'Yohanes Gago',       'kategori' => 'Teknologi',  'tahun_terbit' => 2023, 'penerbit' => 'Informatika'],
            ['kode_buku' => 'BK012', 'judul' => 'Sejarah Indonesia',      'penulis' => 'Sartono Kartodirdjo','kategori' => 'Sejarah',    'tahun_terbit' => 2012, 'penerbit' => 'Yudhistira'],
        ];

        foreach ($buku as $item) {
            Buku::updateOrCreate(['kode_buku' => $item['kode_buku']], $item);
        }

        // ---------- CONTOH PEMINJAMAN ----------
        $petugas = User::where('username', 'petugas')->first();
        $kode = fn (string $k) => Buku::where('kode_buku', $k)->first()?->id;

        $peminjaman = [
            // Siswa 1: satu menunggu, satu dipinjam, satu sudah dikembalikan
            ['user' => $siswa,  'buku' => $kode('BK001'), 'status' => Peminjaman::STATUS_MENUNGGU,     'catatan' => 'Untuk tugas sastra', 'pinjam' => null, 'kembali' => null, 'selesai' => null, 'oleh' => null],
            ['user' => $siswa,  'buku' => $kode('BK003'), 'status' => Peminjaman::STATUS_DIPINJAM,     'catatan' => null, 'pinjam' => now()->subDays(2)->toDateString(), 'kembali' => now()->addDays(5)->toDateString(), 'selesai' => null, 'oleh' => $petugas?->id],
            ['user' => $siswa,  'buku' => $kode('BK008'), 'status' => Peminjaman::STATUS_DIKEMBALIKAN, 'catatan' => null, 'pinjam' => now()->subDays(14)->toDateString(), 'kembali' => now()->subDays(7)->toDateString(), 'selesai' => now()->subDays(8)->toDateString(), 'oleh' => $petugas?->id],
            // Siswa 2: satu menunggu, satu dipinjam
            ['user' => $siswa2, 'buku' => $kode('BK006'), 'status' => Peminjaman::STATUS_MENUNGGU,     'catatan' => 'Bacaan pribadi', 'pinjam' => null, 'kembali' => null, 'selesai' => null, 'oleh' => null],
            ['user' => $siswa2, 'buku' => $kode('BK011'), 'status' => Peminjaman::STATUS_DIPINJAM,     'catatan' => null, 'pinjam' => now()->subDays(1)->toDateString(), 'kembali' => now()->addDays(6)->toDateString(), 'selesai' => null, 'oleh' => $petugas?->id],
        ];

        foreach ($peminjaman as $row) {
            if (! $row['user'] || ! $row['buku']) {
                continue;
            }

            Peminjaman::updateOrCreate(
                ['user_id' => $row['user']->id, 'buku_id' => $row['buku'], 'status' => $row['status']],
                [
                    'catatan'             => $row['catatan'],
                    'tanggal_pinjam'      => $row['pinjam'],
                    'tanggal_kembali'     => $row['kembali'],
                    'tanggal_pengembalian' => $row['selesai'],
                    'diproses_oleh'       => $row['oleh'],
                ]
            );
        }
    }
}
