<?php

namespace Tests\Feature;

use App\Models\Buku;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Pengujian API Aplikasi Data Buku Perpustakaan.
 *
 * Mencakup: login admin, CRUD buku, proteksi token,
 * statistik dashboard, dan export Excel/PDF.
 */
class BukuApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::create([
            'name'     => 'Administrator',
            'username' => 'admin',
            'email'    => 'admin@perpus.test',
            'password' => 'admin123',
        ]);
    }

    private function sampleBuku(int $count = 12): void
    {
        for ($i = 1; $i <= $count; $i++) {
            Buku::create([
                'kode_buku'    => sprintf('BK%03d', $i),
                'judul'        => "Judul Buku {$i}",
                'penulis'      => "Penulis {$i}",
                'kategori'     => $i % 2 ? 'Novel' : 'Teknologi',
                'tahun_terbit' => 2015 + ($i % 10),
                'penerbit'     => 'Penerbit '.($i % 3),
            ]);
        }
    }

    // ---------------------------------------------------------
    // AUTH
    // ---------------------------------------------------------

    public function test_login_dengan_kredensial_benar_mengembalikan_token(): void
    {
        $this->admin();

        $res = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => 'admin123',
        ]);

        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('user.username', 'admin')
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_dengan_kredensial_salah_gagal(): void
    {
        $this->admin();

        $res = $this->postJson('/api/login', [
            'username' => 'admin',
            'password' => 'salah',
        ]);

        $res->assertStatus(422)
            ->assertJsonPath('errors.username.0', 'Username atau password salah.');
    }

    public function test_login_dengan_username_tidak_dikenal_gagal(): void
    {
        $this->admin();

        $this->postJson('/api/login', [
            'username' => 'tidakada',
            'password' => 'admin123',
        ])->assertStatus(422);
    }

    public function test_logout_mencabut_token(): void
    {
        $user = $this->admin();
        $token = $user->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/logout')->assertOk();

        // Token sudah dicabut dari database
        $this->assertDatabaseMissing('personal_access_tokens', [
            'name' => 't',
        ]);

        // Request berikutnya dengan token lama harus ditolak.
        // Guard Sanctum meng-cache user selama satu method test,
        // jadi cache-nya dibersihkan dulu.
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/statistik')->assertStatus(401);
    }

    public function test_me_mengembalikan_data_admin(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.username', 'admin');
    }

    // ---------------------------------------------------------
    // READ
    // ---------------------------------------------------------

    public function test_mengambil_semua_data_buku(): void
    {
        $this->sampleBuku(12);

        $res = $this->getJson('/api/buku');

        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('total', 12);
    }

    public function test_mengambil_satu_data_buku(): void
    {
        $buku = Buku::create([
            'kode_buku'    => 'BK001',
            'judul'        => 'Laskar Pelangi',
            'penulis'      => 'Andrea Hirata',
            'kategori'     => 'Novel',
            'tahun_terbit' => 2005,
            'penerbit'     => 'Bentang Pustaka',
        ]);

        $this->getJson('/api/buku/'.$buku->id)
            ->assertOk()
            ->assertJsonPath('data.judul', 'Laskar Pelangi')
            ->assertJsonPath('data.tahun_terbit', 2005);
    }

    public function test_data_buku_tidak_ditemukan_menghasilkan_404(): void
    {
        $this->getJson('/api/buku/999')->assertStatus(404);
    }

    public function test_pencarian_buku_bekerja(): void
    {
        $this->sampleBuku(5);
        Buku::create([
            'kode_buku'    => 'BK999',
            'judul'        => 'Pemrograman PHP Unik',
            'penulis'      => 'Abdul Kadir',
            'kategori'     => 'Teknologi',
            'tahun_terbit' => 2020,
            'penerbit'     => 'Andi',
        ]);

        $res = $this->getJson('/api/buku?q=pemrograman');

        $res->assertOk()->assertJsonPath('total', 1);
    }

    public function test_get_buku_tidak_butuh_login(): void
    {
        $this->sampleBuku(3);

        $this->getJson('/api/buku')->assertOk();
    }

    // ---------------------------------------------------------
    // CREATE
    // ---------------------------------------------------------

    public function test_tambah_buku_dengan_token_benar(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $payload = [
            'kode_buku'    => 'BK013',
            'judul'        => 'Laravel untuk Pemula',
            'penulis'      => 'Budi Santoso',
            'kategori'     => 'Teknologi',
            'tahun_terbit' => 2025,
            'penerbit'     => 'Informatika',
        ];

        $this->withToken($token)->postJson('/api/buku', $payload)
            ->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('buku', ['kode_buku' => 'BK013']);
    }

    public function test_tambah_buku_tanpa_token_ditolak(): void
    {
        $this->postJson('/api/buku', [])->assertStatus(401);
    }

    public function test_tambah_buku_dengan_field_kosong_ditolak(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/buku', [
            'kode_buku'    => 'BK001',
            'judul'        => '',
            'penulis'      => '',
            'kategori'     => '',
            'tahun_terbit' => 'abc',
            'penerbit'     => '',
        ])->assertStatus(422);
    }

    public function test_tahun_terbit_harus_bilangan_bulat(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/buku', [
            'kode_buku'    => 'BK001',
            'judul'        => 'Judul',
            'penulis'      => 'Penulis',
            'kategori'     => 'Novel',
            'tahun_terbit' => 'abc',
            'penerbit'     => 'Penerbit',
        ])->assertStatus(422);
    }

    public function test_kode_buku_tidak_boleh_duplikat(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $this->sampleBuku(1); // BK001 sudah ada

        $this->withToken($token)->postJson('/api/buku', [
            'kode_buku'    => 'BK001',
            'judul'        => 'Judul Baru',
            'penulis'      => 'Penulis',
            'kategori'     => 'Novel',
            'tahun_terbit' => 2020,
            'penerbit'     => 'Penerbit',
        ])->assertStatus(422);
    }

    public function test_kode_buku_divalidasi_hanya_huruf_angka(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $this->withToken($token)->postJson('/api/buku', [
            'kode_buku'    => 'BK-01!!',
            'judul'        => 'Judul',
            'penulis'      => 'Penulis',
            'kategori'     => 'Novel',
            'tahun_terbit' => 2020,
            'penerbit'     => 'Penerbit',
        ])->assertStatus(422);
    }

    // ---------------------------------------------------------
    // UPDATE
    // ---------------------------------------------------------

    public function test_edit_buku_bekerja(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(1);

        $id = Buku::first()->id;

        $this->withToken($token)->putJson("/api/buku/{$id}", [
            'kode_buku'    => 'BK001',
            'judul'        => 'Judul Hasil Edit',
            'penulis'      => 'Penulis Edit',
            'kategori'     => 'Sejarah',
            'tahun_terbit' => 2026,
            'penerbit'     => 'Penerbit Edit',
        ])->assertOk()->assertJsonPath('status', 'success');

        $this->assertDatabaseHas('buku', [
            'id'     => $id,
            'judul'  => 'Judul Hasil Edit',
            'kategori' => 'Sejarah',
        ]);
    }

    public function test_edit_buku_tanpa_token_ditolak(): void
    {
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        $this->putJson("/api/buku/{$id}", [])->assertStatus(401);
    }

    public function test_edit_buku_tidak_ada_menghasilkan_404(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $this->withToken($token)->putJson('/api/buku/999', [
            'kode_buku'    => 'BK999',
            'judul'        => 'X',
            'penulis'      => 'X',
            'kategori'     => 'X',
            'tahun_terbit' => 2020,
            'penerbit'     => 'X',
        ])->assertStatus(404);
    }

    public function test_kode_buku_tidak_boleh_dipakai_buku_lain(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(2); // BK001 & BK002

        // BK002 id-nya kedua, coba diganti jadi BK001 (milik id pertama)
        $id = Buku::where('kode_buku', 'BK002')->first()->id;

        $this->withToken($token)->putJson("/api/buku/{$id}", [
            'kode_buku'    => 'BK001',
            'judul'        => 'Judul',
            'penulis'      => 'Penulis',
            'kategori'     => 'Novel',
            'tahun_terbit' => 2020,
            'penerbit'     => 'Penerbit',
        ])->assertStatus(422);
    }

    // ---------------------------------------------------------
    // DELETE
    // ---------------------------------------------------------

    public function test_hapus_buku_bekerja(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(2);

        $id = Buku::first()->id;

        $this->withToken($token)->deleteJson("/api/buku/{$id}")
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('buku', ['id' => $id]);
    }

    public function test_hapus_buku_tanpa_token_ditolak(): void
    {
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        $this->deleteJson("/api/buku/{$id}")->assertStatus(401);
    }

    public function test_hapus_buku_tidak_ada_menghasilkan_404(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $this->withToken($token)->deleteJson('/api/buku/999')->assertStatus(404);
    }

    // ---------------------------------------------------------
    // STATISTIK
    // ---------------------------------------------------------

    public function test_statistik_tanpa_token_ditolak(): void
    {
        $this->getJson('/api/statistik')->assertStatus(401);
    }

    public function test_statistik_menghitung_data_dengan_benar(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(12);

        $res = $this->withToken($token)->getJson('/api/statistik');

        $res->assertOk()
            ->assertJsonPath('data.total_buku', 12)
            ->assertJsonPath('data.total_kategori', 2) // Novel & Teknologi
            ->assertJsonPath('data.kategori_terbanyak', 'Novel')
            ->assertJsonStructure([
                'data' => [
                    'total_buku', 'total_kategori', 'total_penulis',
                    'kategori_terbanyak', 'buku_per_kategori',
                    'buku_per_tahun', 'buku_per_penerbit', 'buku_terbaru',
                ],
            ]);
    }

    public function test_statistik_dengan_database_kosong(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $this->withToken($token)->getJson('/api/statistik')
            ->assertOk()
            ->assertJsonPath('data.total_buku', 0)
            ->assertJsonPath('data.kategori_terbanyak', '-');
    }

    // ---------------------------------------------------------
    // EXPORT
    // ---------------------------------------------------------

    public function test_export_excel_tanpa_token_ditolak(): void
    {
        $this->getJson('/api/export/excel')->assertStatus(401);
    }

    public function test_export_pdf_tanpa_token_ditolak(): void
    {
        $this->getJson('/api/export/pdf')->assertStatus(401);
    }

    public function test_export_excel_menghasilkan_file_xls(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(12);

        $res = $this->withToken($token)->get('/api/export/excel');

        $res->assertOk();
        $this->assertStringContainsString(
            'application/vnd.ms-excel',
            $res->headers->get('Content-Type'),
        );
        $this->assertStringContainsString(
            '.xls',
            $res->headers->get('Content-Disposition'),
        );

        $body = $res->getContent();
        $this->assertStringContainsString('mso-application', $body);
        $this->assertStringContainsString('KODE BUKU', $body);
        $this->assertStringContainsString('TAHUN TERBIT', $body);
        $this->assertStringContainsString('PENERBIT', $body);
        $this->assertStringContainsString('Judul Buku 1', $body);
        $this->assertStringContainsString('BK012', $body);
    }

    public function test_export_pdf_menghasilkan_file_pdf(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(12);

        $res = $this->withToken($token)->get('/api/export/pdf');

        $res->assertOk();
        $this->assertStringContainsString(
            'application/pdf',
            $res->headers->get('Content-Type'),
        );

        // Header magic file PDF
        $this->assertStringStartsWith('%PDF', $res->getContent());
    }

    public function test_export_header_content_disposition_terekspos_untuk_cors(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $res = $this->withToken($token)
            ->withHeaders(['Origin' => 'http://localhost:5173'])
            ->get('/api/export/excel');

        $this->assertStringContainsString(
            'http://localhost:5173',
            $res->headers->get('Access-Control-Allow-Origin') ?? '',
        );
    }

    // ---------------------------------------------------------
    // COVER / SAMPUL
    // ---------------------------------------------------------

    /** Data URL PNG 1x1 yang valid, dipakai sebagai sampul uji. */
    private function tinyPng(): string
    {
        $base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

        return 'data:image/png;base64,'.$base64;
    }

    /** Payload lengkap untuk tambah/edit buku. */
    private function bukuPayload(array $extra = []): array
    {
        return array_merge([
            'kode_buku'    => 'BK001',
            'judul'        => 'Judul Sampul',
            'penulis'      => 'Penulis',
            'kategori'     => 'Novel',
            'tahun_terbit' => 2020,
            'penerbit'     => 'Penerbit',
        ], $extra);
    }

    public function test_edit_buku_bisa_mengunggah_sampul(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        $this->withToken($token)
            ->putJson("/api/buku/{$id}", $this->bukuPayload(['cover' => $this->tinyPng()]))
            ->assertOk()
            ->assertJsonPath('status', 'success');

        $cover = Buku::find($id)->cover;

        $this->assertNotNull($cover);
        $this->assertFileExists(storage_path('app/private/cover/'.$cover));

        // Sampul boleh diambil tanpa token (katalog bersifat publik)
        $res = $this->get('/api/buku/'.$id.'/cover');
        $res->assertOk();
        $this->assertStringContainsString('image/png', $res->headers->get('Content-Type'));

        File::delete(storage_path('app/private/cover/'.$cover));
    }

    public function test_tambah_buku_bisa_langsung_dengan_sampul(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;

        $res = $this->withToken($token)
            ->postJson('/api/buku', $this->bukuPayload(['cover' => $this->tinyPng()]))
            ->assertStatus(201);

        $id    = $res->json('data.id');
        $cover = Buku::find($id)->cover;

        $this->assertNotNull($cover);
        $this->assertFileExists(storage_path('app/private/cover/'.$cover));

        File::delete(storage_path('app/private/cover/'.$cover));
    }

    public function test_sampul_bisa_dihapus_dengan_string_kosong(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        $this->withToken($token)
            ->putJson("/api/buku/{$id}", $this->bukuPayload(['cover' => $this->tinyPng()]))
            ->assertOk();

        $lama = Buku::find($id)->cover;
        $this->assertNotNull($lama);

        $this->withToken($token)
            ->putJson("/api/buku/{$id}", $this->bukuPayload(['cover' => '']))
            ->assertOk();

        $this->assertNull(Buku::find($id)->cover);
        $this->assertFileDoesNotExist(storage_path('app/private/cover/'.$lama));
    }

    public function test_sampul_tidak_dikirim_tidak_mengubah_sampul_lama(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        $this->withToken($token)
            ->putJson("/api/buku/{$id}", $this->bukuPayload(['cover' => $this->tinyPng()]))
            ->assertOk();

        $lama = Buku::find($id)->cover;

        $this->withToken($token)
            ->putJson("/api/buku/{$id}", $this->bukuPayload())
            ->assertOk();

        $this->assertSame($lama, Buku::find($id)->cover);
        $this->assertFileExists(storage_path('app/private/cover/'.$lama));

        File::delete(storage_path('app/private/cover/'.$lama));
    }

    public function test_sampul_lebih_dari_3mb_ditolak(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        $this->withToken($token)
            ->putJson("/api/buku/{$id}", $this->bukuPayload([
                'cover' => 'data:image/png;base64,'.base64_encode(str_repeat('A', 3145729)),
            ]))
            ->assertStatus(422)
            ->assertJsonPath('errors.cover.0', 'Ukuran sampul maksimal 3MB.');
    }

    public function test_sampul_format_tidak_didukung_ditolak(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        $this->withToken($token)
            ->putJson("/api/buku/{$id}", $this->bukuPayload([
                'cover' => 'data:text/plain;base64,'.base64_encode('bukan gambar'),
            ]))
            ->assertStatus(422)
            ->assertJsonPath(
                'errors.cover.0',
                'Format sampul tidak didukung. Gunakan JPG, PNG, atau WEBP.',
            );
    }

    public function test_isi_file_sampul_harus_benar_benar_gambar(): void
    {
        $token = $this->admin()->createToken('t')->plainTextToken;
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        // Awalan data URL bilang PNG, tapi isinya teks biasa
        $this->withToken($token)
            ->putJson("/api/buku/{$id}", $this->bukuPayload([
                'cover' => 'data:image/png;base64,'.base64_encode('isi file bukan gambar'),
            ]))
            ->assertStatus(422)
            ->assertJsonPath(
                'errors.cover.0',
                'Format sampul tidak didukung. Gunakan JPG, PNG, atau WEBP.',
            );
    }

    public function test_sampul_tidak_ada_menghasilkan_404(): void
    {
        $this->sampleBuku(1);
        $id = Buku::first()->id;

        $this->get("/api/buku/{$id}/cover")->assertStatus(404);
        $this->get('/api/buku/999/cover')->assertStatus(404);
    }
}
