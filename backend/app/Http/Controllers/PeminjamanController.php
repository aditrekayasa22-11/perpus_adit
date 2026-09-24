<?php

namespace App\Http\Controllers;

use App\Models\Peminjaman;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PeminjamanController extends Controller
{
    /** Status yang valid dipakai untuk filter & ringkasan. */
    private const STATUSES = [
        Peminjaman::STATUS_MENUNGGU,
        Peminjaman::STATUS_DIPINJAM,
        Peminjaman::STATUS_DIKEMBALIKAN,
    ];

    /**
     * Daftar semua peminjaman (untuk petugas & admin).
     * GET /api/peminjaman?status=menunggu
     */
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'nullable', Rule::in(self::STATUSES)],
        ]);

        $query = Peminjaman::with(['user', 'buku', 'petugas'])->orderByDesc('id');

        if (! empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        $rows = $query->get();

        return response()->json([
            'status'    => 'success',
            'total'     => $rows->count(),
            'ringkasan' => self::ringkasan($rows),
            'data'      => $rows,
        ]);
    }

    /**
     * Riwayat peminjaman milik siswa yang sedang login.
     * GET /api/peminjaman/saya
     */
    public function saya(Request $request): JsonResponse
    {
        $rows = Peminjaman::with(['buku', 'petugas'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'status'    => 'success',
            'total'     => $rows->count(),
            'ringkasan' => self::ringkasan($rows),
            'data'      => $rows,
        ]);
    }

    /**
     * Siswa mengajukan pinjam buku (status awal: menunggu).
     * POST /api/peminjaman
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'buku_id' => ['required', 'integer', 'exists:buku,id'],
            'catatan' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();

        // Satu buku hanya boleh punya satu pinjaman aktif per siswa.
        $aktif = Peminjaman::where('user_id', $user->id)
            ->where('buku_id', $data['buku_id'])
            ->whereIn('status', [Peminjaman::STATUS_MENUNGGU, Peminjaman::STATUS_DIPINJAM])
            ->exists();

        if ($aktif) {
            throw ValidationException::withMessages([
                'buku_id' => ['Anda masih memiliki pengajuan/pinjaman aktif untuk buku ini.'],
            ]);
        }

        $peminjaman = Peminjaman::create([
            'user_id' => $user->id,
            'buku_id' => $data['buku_id'],
            'catatan' => $data['catatan'] ?? null,
            'status'  => Peminjaman::STATUS_MENUNGGU,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengajuan peminjaman buku berhasil diajukan. Menunggu proses petugas.',
            'data'    => $peminjaman->load(['buku', 'petugas']),
        ], 201);
    }

    /**
     * Petugas menyetujui pengajuan → status dipinjam + batas pengembalian.
     * PATCH /api/peminjaman/{id}/setujui
     */
    public function setujui(Request $request, int $id): JsonResponse
    {
        $peminjaman = $this->find($id);

        if ($peminjaman->status !== Peminjaman::STATUS_MENUNGGU) {
            throw ValidationException::withMessages([
                'status' => ['Hanya pengajuan berstatus menunggu yang dapat disetujui.'],
            ]);
        }

        $peminjaman->update([
            'status'          => Peminjaman::STATUS_DIPINJAM,
            'tanggal_pinjam'  => now()->toDateString(),
            'tanggal_kembali' => now()->addDays(7)->toDateString(),
            'diproses_oleh'   => $request->user()->id,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Peminjaman disetujui. Siswa kini berstatus dipinjam (batas 7 hari).',
            'data'    => $peminjaman->fresh()->load(['user', 'buku', 'petugas']),
        ]);
    }

    /**
     * Petugas memproses pengembalian → status dikembalikan.
     * PATCH /api/peminjaman/{id}/kembali
     */
    public function kembali(Request $request, int $id): JsonResponse
    {
        $peminjaman = $this->find($id);

        if ($peminjaman->status !== Peminjaman::STATUS_DIPINJAM) {
            throw ValidationException::withMessages([
                'status' => ['Hanya buku berstatus dipinjam yang dapat diproses pengembaliannya.'],
            ]);
        }

        $peminjaman->update([
            'status'               => Peminjaman::STATUS_DIKEMBALIKAN,
            'tanggal_pengembalian' => now()->toDateString(),
            'diproses_oleh'        => $request->user()->id,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengembalian buku berhasil diproses.',
            'data'    => $peminjaman->fresh()->load(['user', 'buku', 'petugas']),
        ]);
    }

    /** Ambil record atau balas 404 konsisten. */
    private function find(int $id): Peminjaman
    {
        $peminjaman = Peminjaman::find($id);

        if (! $peminjaman) {
            abort(404, 'Data peminjaman tidak ditemukan.');
        }

        return $peminjaman;
    }

    /**
     * Hitung jumlah tiap status untuk kartu statistik dashboard.
     *
     * @param  \Illuminate\Support\Collection<int, Peminjaman>  $rows
     * @return array<string, int>
     */
    private static function ringkasan($rows): array
    {
        $out = [
            'menunggu'      => 0,
            'dipinjam'      => 0,
            'dikembalikan'  => 0,
            'total'         => $rows->count(),
        ];

        foreach ($rows as $row) {
            if (isset($out[$row->status])) {
                $out[$row->status]++;
            }
        }

        return $out;
    }
}
