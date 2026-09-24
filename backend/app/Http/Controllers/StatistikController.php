<?php

namespace App\Http\Controllers;

use App\Models\Buku;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatistikController extends Controller
{
    /**
     * Statistik untuk dashboard admin.
     * GET /api/statistik
     */
    public function index(): JsonResponse
    {
        $totalBuku     = Buku::count();
        $totalKategori = Buku::distinct()->count('kategori');
        $totalPenulis  = Buku::distinct()->count('penulis');

        $perKategori = Buku::select('kategori', DB::raw('COUNT(*) as jumlah'))
            ->groupBy('kategori')
            ->orderByDesc('jumlah')
            ->orderBy('kategori')
            ->get();

        $perTahun = Buku::select('tahun_terbit', DB::raw('COUNT(*) as jumlah'))
            ->groupBy('tahun_terbit')
            ->orderBy('tahun_terbit')
            ->get();

        $perPenerbit = Buku::select('penerbit', DB::raw('COUNT(*) as jumlah'))
            ->groupBy('penerbit')
            ->orderByDesc('jumlah')
            ->orderBy('penerbit')
            ->limit(5)
            ->get();

        $bukuTerbaru = Buku::orderByDesc('id')->limit(5)->get();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total_buku'         => $totalBuku,
                'total_kategori'     => $totalKategori,
                'total_penulis'      => $totalPenulis,
                'kategori_terbanyak' => $perKategori->first()->kategori ?? '-',
                'buku_per_kategori'  => $perKategori,
                'buku_per_tahun'     => $perTahun,
                'buku_per_penerbit'  => $perPenerbit,
                'buku_terbaru'       => $bukuTerbaru,
            ],
        ]);
    }
}
