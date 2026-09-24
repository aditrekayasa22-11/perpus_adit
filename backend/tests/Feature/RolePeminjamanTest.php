<?php

namespace Tests\Feature;

use App\Models\Buku;
use App\Models\Peminjaman;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Pengujian sistem 3 role (admin, petugas, siswa):
 * register, login per role, guard role, dan alur peminjaman buku.
 */
class RolePeminjamanTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role, string $username = null): User
    {
        $username = $username ?: $role;

        return User::create([
            'name'     => ucfirst($role),
            'username' => $username,
            'email'    => "{$username}@perpus.test",
            'password' => "{$role}123",
            'role'     => $role,
        ]);
    }

    private function sampleBuku(int $i = 1): Buku
    {
        return Buku::create([
            'kode_buku'    => sprintf('BK%03d', $i),
            'judul'        => "Judul Buku {$i}",
            'penulis'      => "Penulis {$i}",
            'kategori'     => 'Novel',
            'tahun_terbit' => 2020,
            'penerbit'     => 'Penerbit',
        ]);
    }

    private function tokenFor(User $user): string
    {
        return $user->createToken('t')->plainTextToken;
    }

    // ---------------------------------------------------------
    // REGISTER
    // ---------------------------------------------------------

    public function test_register_siswa_baru_mengembalikan_token_dan_role(): void
    {
        $res = $this->postJson('/api/register', [
            'name'                  => 'Siswa Baru',
            'username'              => 'siswabaru',
            'email'                 => 'siswabaru@perpus.test',
            'password'              => 'rahasia123',
            'password_confirmation' => 'rahasia123',
            'role'                  => 'siswa',
        ]);

        $res->assertCreated()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('user.username', 'siswabaru')
            ->assertJsonPath('user.role', 'siswa')
            ->assertJsonStructure(['token', 'user']);

        $this->assertDatabaseHas('users', ['username' => 'siswabaru', 'role' => 'siswa']);
    }

    public function test_register_ditolak_bila_role_admin(): void
    {
        $res = $this->postJson('/api/register', [
            'name'                  => 'Hacker',
            'username'              => 'hacker',
            'email'                 => 'hacker@perpus.test',
            'password'              => 'rahasia123',
            'password_confirmation' => 'rahasia123',
            'role'                  => 'admin',
        ]);

        $res->assertStatus(422)->assertJsonValidationErrors(['role']);
        $this->assertDatabaseMissing('users', ['username' => 'hacker']);
    }

    public function test_register_dengan_username_sudah_dipakai_ditolak(): void
    {
        $this->makeUser('siswa', 'pendaftar');

        $res = $this->postJson('/api/register', [
            'name'                  => 'Pendaftar',
            'username'              => 'pendaftar',
            'email'                 => 'lain@perpus.test',
            'password'              => 'rahasia123',
            'password_confirmation' => 'rahasia123',
            'role'                  => 'siswa',
        ]);

        $res->assertStatus(422)->assertJsonValidationErrors(['username']);
    }

    // ---------------------------------------------------------
    // LOGIN PER ROLE
    // ---------------------------------------------------------

    public function test_login_mengembalikan_role_akun(): void
    {
        $this->makeUser('petugas');

        $res = $this->postJson('/api/login', [
            'username' => 'petugas',
            'password' => 'petugas123',
        ]);

        $res->assertOk()
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('user.role', 'petugas')
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_dengan_role_halaman_yang_salah_ditolak(): void
    {
        $this->makeUser('siswa');

        // Halaman login petugas dipakai untuk akun siswa → harus ditolak.
        $res = $this->postJson('/api/login', [
            'username' => 'siswa',
            'password' => 'siswa123',
            'role'     => 'petugas',
        ]);

        $res->assertStatus(422)->assertJsonValidationErrors(['role']);
    }

    public function test_me_mengembalikan_role(): void
    {
        $siswa = $this->makeUser('siswa');

        $this->withToken($this->tokenFor($siswa))
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'siswa');
    }

    // ---------------------------------------------------------
    // GUARD ROLE
    // ---------------------------------------------------------

    public function test_siswa_ditolak_membuka_data_peminjaman_semua(): void
    {
        $siswa = $this->makeUser('siswa');

        $this->withToken($this->tokenFor($siswa))
            ->getJson('/api/peminjaman')
            ->assertStatus(403);
    }

    public function test_siswa_ditolak_menambah_buku(): void
    {
        $siswa = $this->makeUser('siswa');

        $this->withToken($this->tokenFor($siswa))
            ->postJson('/api/buku', [
                'kode_buku'    => 'BK999',
                'judul'        => 'X',
                'penulis'      => 'Y',
                'kategori'     => 'Novel',
                'tahun_terbit' => 2024,
                'penerbit'     => 'Z',
            ])
            ->assertStatus(403);
    }

    public function test_petugas_ditolak_menambah_buku_tapi_boleh_melihat_peminjaman(): void
    {
        $petugas = $this->makeUser('petugas');
        $token   = $this->tokenFor($petugas);

        $this->withToken($token)
            ->postJson('/api/buku', [
                'kode_buku'    => 'BK999',
                'judul'        => 'X',
                'penulis'      => 'Y',
                'kategori'     => 'Novel',
                'tahun_terbit' => 2024,
                'penerbit'     => 'Z',
            ])
            ->assertStatus(403);

        $this->withToken($token)
            ->getJson('/api/peminjaman')
            ->assertOk();
    }

    // ---------------------------------------------------------
    // ALUR PEMINJAMAN: ajukan → setujui → kembali
    // ---------------------------------------------------------

    public function test_siswa_bisa_mengajukan_pinjam_buku(): void
    {
        $siswa = $this->makeUser('siswa');
        $buku  = $this->sampleBuku();

        $this->withToken($this->tokenFor($siswa))
            ->postJson('/api/peminjaman', ['buku_id' => $buku->id, 'catatan' => 'Tugas'])
            ->assertCreated()
            ->assertJsonPath('data.status', Peminjaman::STATUS_MENUNGGU);

        $this->assertDatabaseHas('peminjaman', [
            'user_id' => $siswa->id,
            'buku_id' => $buku->id,
            'status'  => Peminjaman::STATUS_MENUNGGU,
        ]);
    }

    public function test_siswa_tidak_bisa_mengajukan_buku_yang_masih_aktif(): void
    {
        $siswa = $this->makeUser('siswa');
        $buku  = $this->sampleBuku();

        $this->withToken($this->tokenFor($siswa))
            ->postJson('/api/peminjaman', ['buku_id' => $buku->id])
            ->assertCreated();

        $this->withToken($this->tokenFor($siswa))
            ->postJson('/api/peminjaman', ['buku_id' => $buku->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['buku_id']);
    }

    public function test_peminjaman_saya_hanya_milik_sendiri(): void
    {
        $siswa1 = $this->makeUser('siswa', 'siswa1');
        $siswa2 = $this->makeUser('siswa', 'siswa2');
        $buku   = $this->sampleBuku();

        Peminjaman::create([
            'user_id' => $siswa2->id,
            'buku_id' => $buku->id,
            'status'  => Peminjaman::STATUS_MENUNGGU,
        ]);

        $res = $this->withToken($this->tokenFor($siswa1))
            ->getJson('/api/peminjaman/saya');

        $res->assertOk()->assertJsonPath('total', 0);
    }

    public function test_petugas_menyetujui_pengajuan_menjadi_dipinjam(): void
    {
        $siswa   = $this->makeUser('siswa');
        $petugas = $this->makeUser('petugas');
        $buku    = $this->sampleBuku();

        $pinjam = Peminjaman::create([
            'user_id' => $siswa->id,
            'buku_id' => $buku->id,
            'status'  => Peminjaman::STATUS_MENUNGGU,
        ]);

        $this->withToken($this->tokenFor($petugas))
            ->patchJson("/api/peminjaman/{$pinjam->id}/setujui")
            ->assertOk()
            ->assertJsonPath('data.status', Peminjaman::STATUS_DIPINJAM);

        $row = Peminjaman::find($pinjam->id);
        $this->assertSame(Peminjaman::STATUS_DIPINJAM, $row->status);
        $this->assertNotNull($row->tanggal_pinjam);
        $this->assertNotNull($row->tanggal_kembali);
        $this->assertSame($petugas->id, $row->diproses_oleh);
    }

    public function test_pengajuan_yang_sudah_dipinjam_tidak_bisa_disetujui_lagi(): void
    {
        $petugas = $this->makeUser('petugas');
        $siswa   = $this->makeUser('siswa');
        $buku    = $this->sampleBuku();

        $pinjam = Peminjaman::create([
            'user_id'       => $siswa->id,
            'buku_id'       => $buku->id,
            'status'        => Peminjaman::STATUS_DIPINJAM,
            'tanggal_pinjam' => now()->toDateString(),
        ]);

        $this->withToken($this->tokenFor($petugas))
            ->patchJson("/api/peminjaman/{$pinjam->id}/setujui")
            ->assertStatus(422)
            ->assertJsonValidationErrors(['status']);
    }

    public function test_petugas_memproses_pengembalian(): void
    {
        $petugas = $this->makeUser('petugas');
        $siswa   = $this->makeUser('siswa');
        $buku    = $this->sampleBuku();

        $pinjam = Peminjaman::create([
            'user_id'        => $siswa->id,
            'buku_id'        => $buku->id,
            'status'         => Peminjaman::STATUS_DIPINJAM,
            'tanggal_pinjam' => now()->subDays(3)->toDateString(),
        ]);

        $this->withToken($this->tokenFor($petugas))
            ->patchJson("/api/peminjaman/{$pinjam->id}/kembali")
            ->assertOk()
            ->assertJsonPath('data.status', Peminjaman::STATUS_DIKEMBALIKAN);

        $row = Peminjaman::find($pinjam->id);
        $this->assertSame(Peminjaman::STATUS_DIKEMBALIKAN, $row->status);
        $this->assertNotNull($row->tanggal_pengembalian);
    }

    public function test_siswa_ditolak_menyetujui_peminjaman(): void
    {
        $siswa  = $this->makeUser('siswa');
        $buku   = $this->sampleBuku();

        $pinjam = Peminjaman::create([
            'user_id' => $siswa->id,
            'buku_id' => $buku->id,
            'status'  => Peminjaman::STATUS_MENUNGGU,
        ]);

        $this->withToken($this->tokenFor($siswa))
            ->patchJson("/api/peminjaman/{$pinjam->id}/setujui")
            ->assertStatus(403);
    }

    public function test_peminjaman_tanpa_token_ditolak(): void
    {
        $this->getJson('/api/peminjaman')->assertStatus(401);
        $this->postJson('/api/peminjaman', ['buku_id' => 1])->assertStatus(401);
    }

    public function test_pengajuan_dengan_buku_tidak_valid_ditolak(): void
    {
        $siswa = $this->makeUser('siswa');

        $this->withToken($this->tokenFor($siswa))
            ->postJson('/api/peminjaman', ['buku_id' => 9999])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['buku_id']);
    }

    public function test_admin_bisa_memproses_peminjaman_seperti_petugas(): void
    {
        $admin = $this->makeUser('admin');
        $siswa = $this->makeUser('siswa');
        $buku  = $this->sampleBuku();

        $pinjam = Peminjaman::create([
            'user_id' => $siswa->id,
            'buku_id' => $buku->id,
            'status'  => Peminjaman::STATUS_MENUNGGU,
        ]);

        $this->withToken($this->tokenFor($admin))
            ->getJson('/api/peminjaman')
            ->assertOk();

        $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/peminjaman/{$pinjam->id}/setujui")
            ->assertOk();
    }
}
