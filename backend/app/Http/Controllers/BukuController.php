<?php

namespace App\Http\Controllers;

use App\Models\Buku;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;

class BukuController extends Controller
{
    /** Batas ukuran file sampul: 3MB. */
    private const COVER_MAX_BYTES = 3145728;

    /** Tipe gambar yang diizinkan beserta ekstensi tujuannya. */
    private const COVER_MIME = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];

    /**
     * Ambil semua data buku (+ pencarian opsional ?q=).
     * GET /api/buku
     */
    public function index(Request $request): JsonResponse
    {
        $query = Buku::query()->orderBy('id', 'asc');

        $q = trim((string) $request->query('q', ''));
        if ($q !== '') {
            $query->where(function ($w) use ($q) {
                $w->where('kode_buku', 'like', "%{$q}%")
                    ->orWhere('judul', 'like', "%{$q}%")
                    ->orWhere('penulis', 'like', "%{$q}%")
                    ->orWhere('kategori', 'like', "%{$q}%")
                    ->orWhere('penerbit', 'like', "%{$q}%");
            });
        }

        $buku = $query->get();

        return response()->json([
            'status' => 'success',
            'total'  => $buku->count(),
            'data'   => $buku,
        ]);
    }

    /**
     * Ambil 1 data buku.
     * GET /api/buku/{id}
     */
    public function show(int $id): JsonResponse
    {
        $buku = Buku::find($id);

        if (! $buku) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data buku tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data'   => $buku,
        ]);
    }

    /**
     * Ambil gambar sampul buku (publik, dipakai <img> di frontend).
     * GET /api/buku/{id}/cover
     */
    public function cover(int $id): Response
    {
        $buku = Buku::find($id);

        if (! $buku || ! $buku->cover) {
            abort(404, 'Sampul buku tidak ditemukan.');
        }

        $path = self::coverDir().'/'.$buku->cover;

        if (! is_file($path)) {
            abort(404, 'Sampul buku tidak ditemukan.');
        }

        $ext  = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mime = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png'  => 'image/png',
            'webp' => 'image/webp',
        ][$ext] ?? 'application/octet-stream';

        return response(File::get($path), 200, [
            'Content-Type'  => $mime,
            'Cache-Control' => 'public, max-age=604800',
        ]);
    }

    /**
     * Tambah data buku.
     * POST /api/buku
     */
    public function store(Request $request): JsonResponse
    {
        $data  = $this->validated($request);
        $cover = $this->extractCover($request);

        $buku = Buku::create($data);

        if ($cover !== null) {
            $buku->cover = $this->storeCover($buku, $cover);
            $buku->save();
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Data buku berhasil ditambahkan.',
            'data'    => $buku,
        ], 201);
    }

    /**
     * Edit data buku.
     * PUT /api/buku/{id}
     *
     * Field `cover` bersifat opsional:
     *   - tidak dikirim      -> sampul tidak diubah
     *   - data URL base64    -> sampul diganti
     *   - string kosong      -> sampul dihapus
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $buku = Buku::find($id);

        if (! $buku) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data buku tidak ditemukan.',
            ], 404);
        }

        $data = $this->validated($request, $buku->id);
        $buku->fill($data);

        if ($request->has('cover')) {
            $cover = $this->extractCover($request);

            $this->removeCover($buku->cover);
            $buku->cover = $cover === null ? null : $this->storeCover($buku, $cover);
        }

        $buku->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Data buku berhasil diperbarui.',
            'data'    => $buku->fresh(),
        ]);
    }

    /**
     * Hapus data buku (file sampul ikut dihapus).
     * DELETE /api/buku/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $buku = Buku::find($id);

        if (! $buku) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Data buku tidak ditemukan.',
            ], 404);
        }

        $this->removeCover($buku->cover);
        $buku->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Data buku berhasil dihapus.',
        ]);
    }

    /**
     * Validasi input tambah/edit data buku.
     *
     * @return array<string, mixed>
     */
    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'kode_buku'    => ['required', 'string', 'max:10', 'regex:/^[A-Za-z0-9]+$/',
                \Illuminate\Validation\Rule::unique('buku', 'kode_buku')->ignore($ignoreId)],
            'judul'        => ['required', 'string', 'max:150'],
            'penulis'      => ['required', 'string', 'max:100'],
            'kategori'     => ['required', 'string', 'max:50'],
            'tahun_terbit' => ['required', 'integer', 'min:1900', 'max:2100'],
            'penerbit'     => ['required', 'string', 'max:100'],
        ], [
            'kode_buku.regex'  => 'Kode buku hanya boleh huruf dan angka.',
            'kode_buku.unique' => 'Kode buku sudah digunakan.',
        ]);

        $data['kode_buku']    = strtoupper($data['kode_buku']);
        $data['tahun_terbit'] = (int) $data['tahun_terbit'];

        return $data;
    }

    /**
     * Decode & validasi sampul dari data URL base64.
     *
     * @return array{binary: string, ext: string}|null null bila tidak ada sampul
     */
    private function extractCover(Request $request): ?array
    {
        if (! $request->has('cover')) {
            return null;
        }

        $raw = $request->input('cover');

        if ($raw === null || $raw === '') {
            return null;
        }

        if (! is_string($raw)) {
            throw ValidationException::withMessages([
                'cover' => 'Data sampul tidak valid.',
            ]);
        }

        if (! preg_match('#^data:image/(png|jpe?g|webp);base64,#i', $raw, $match)) {
            throw ValidationException::withMessages([
                'cover' => 'Format sampul tidak didukung. Gunakan JPG, PNG, atau WEBP.',
            ]);
        }

        $binary = base64_decode(substr($raw, strpos($raw, ',') + 1), true);

        if ($binary === false || $binary === '') {
            throw ValidationException::withMessages([
                'cover' => 'Data sampul tidak valid.',
            ]);
        }

        if (strlen($binary) > self::COVER_MAX_BYTES) {
            throw ValidationException::withMessages([
                'cover' => 'Ukuran sampul maksimal 3MB.',
            ]);
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($binary);
        $ext  = self::COVER_MIME[$mime] ?? null;

        if ($ext === null) {
            throw ValidationException::withMessages([
                'cover' => 'Format sampul tidak didukung. Gunakan JPG, PNG, atau WEBP.',
            ]);
        }

        // Pastikan awalan data URL sesuai isi file sebenarnya.
        $declared = strtolower($match[1]);
        $declared = $declared === 'jpeg' ? 'jpg' : $declared;

        if ($declared !== $ext) {
            throw ValidationException::withMessages([
                'cover' => 'Format sampul tidak sesuai dengan data yang dikirim.',
            ]);
        }

        return ['binary' => $binary, 'ext' => $ext];
    }

    /**
     * Simpan file sampul ke storage/app/private/cover dan kembalikan namanya.
     *
     * @param  array{binary: string, ext: string}  $cover
     */
    private function storeCover(Buku $buku, array $cover): string
    {
        $dir = self::coverDir();

        if (! is_dir($dir)) {
            File::makeDirectory($dir, 0755, true, true);
        }

        $name = sprintf(
            '%s_%d_%s.%s',
            $buku->kode_buku,
            time(),
            Str::random(6),
            $cover['ext'],
        );

        File::put($dir.'/'.$name, $cover['binary']);

        return $name;
    }

    /** Hapus file sampul lama bila ada. */
    private function removeCover(?string $name): void
    {
        if ($name !== null && $name !== '') {
            File::delete(self::coverDir().'/'.$name);
        }
    }

    private static function coverDir(): string
    {
        return storage_path('app/private/cover');
    }
}
