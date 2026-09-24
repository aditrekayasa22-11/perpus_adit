# Aplikasi Data Buku Perpustakaan

Aplikasi pengelolaan data buku perpustakaan berbasis **JSON API** dengan fitur
**3 Role (Admin, Petugas, Siswa)**, **halaman Login terpisah per role**,
**halaman Register**, **CRUD**, **Dashboard Statistik**, **Fitur Peminjaman Buku**,
**Export Excel dan PDF**, serta **halaman Tambah / Edit** lengkap dengan
unggah gambar sampul dan **Live 3D Book Preview**.

> **Fitur saat ini:** 3 role (admin / petugas / siswa), halaman login terpisah
> per role, register, dan alur peminjaman buku
> (menunggu → dipinjam → dikembalikan).

- **Backend :** Laravel 12 (PHP 8.2) + MySQL/MariaDB + Sanctum (token)
- **Frontend :** React 19 + Vite + React Router (Fetch API)
- **Export   :** Excel (SpreadsheetML) dan PDF (dompdf)

### Tiga Role

| Role   | Halaman Login      | Dashboard          | Fitur utama |
|--------|--------------------|--------------------|-------------|
| Admin  | `/login`           | `/dashboard`       | Kelola buku, kategori, laporan, katalog, export, + proses peminjaman |
| Petugas| `/login/petugas`   | `/dashboard-petugas` | Lihat pengajuan, **proses peminjaman** & **proses pengembalian** |
| Siswa  | `/login/siswa`     | `/dashboard-siswa` | Telusuri daftar buku, **ajukan pinjam**, pantau status peminjaman |

---

## 1. Struktur Project

```
perpus_api/
├── backend/                      # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── AuthController.php        # Login, Logout, Me, Register
│   │   │   ├── BukuController.php        # CRUD data buku + sampul
│   │   │   ├── PeminjamanController.php  # Ajukan / setujui / kembali
│   │   │   ├── StatistikController.php   # Statistik dashboard
│   │   │   └── ExportController.php      # Export Excel & PDF
│   │   ├── Http/Middleware/
│   │   │   └── EnsureRole.php            # Guard role (admin/petugas/siswa)
│   │   └── Models/
│   │       ├── Buku.php
│   │       ├── Peminjaman.php            # Status: menunggu/dipinjam/dikembalikan
│   │       └── User.php                  # + kolom `role`
│   ├── config/cors.php                   # Izinkan frontend (port 5173)
│   ├── database/
│   │   ├── migrations/                   # Skema tabel (cover, role, peminjaman)
│   │   └── seeders/DatabaseSeeder.php    # Admin + petugas + siswa + 12 buku
│   ├── lang/id/                          # Pesan validasi Bahasa Indonesia
│   ├── resources/views/export/
│   │   └── buku_pdf.blade.php            # Template cetak PDF
│   ├── routes/api.php                    # Semua route API (dikelompokkan per role)
│   ├── storage/app/private/cover/        # File gambar sampul (opsional)
│   └── tests/Feature/                    # 60 automated test (Buku + Role/Peminjaman)
│
├── database/
│   └── db_perpus_api.sql                 # File SQL (siap import phpMyAdmin)
│
├── frontend/                     # Aplikasi React
│   ├── src/
│   │   ├── api/client.js                 # Fetch wrapper + token
│   │   ├── config/site.js                # Identitas sekolah + role & route login
│   │   ├── context/AuthContext.jsx       # Status login + role (login/register)
│   │   ├── routes/ProtectedRoute.jsx     # Jaga route setelah login
│   │   ├── components/
│   │   │   ├── Layout.jsx + .css         # Sidebar menu + topbar breadcrumb
│   │   │   ├── Cover.jsx                 # Sampul mini (gambar / emoji)
│   │   │   └── BookPreview3D.jsx         # Pratinjau sampul 3D
│   │   ├── pages/
│   │   │   ├── Login.jsx + Login.css     # Login 3 role (admin/petugas/siswa)
│   │   │   ├── Register.jsx + .css       # Halaman daftar akun (siswa/petugas)
│   │   │   ├── Dashboard.jsx + .css      # Statistik, tren, donut, koleksi
│   │   │   ├── DashboardPetugas.jsx      # Ringkasan pengajuan menunggu
│   │   │   ├── DashboardSiswa.jsx        # Ringkasan peminjaman sendiri
│   │   │   ├── Peminjaman.jsx + .css     # Proses peminjaman & pengembalian
│   │   │   ├── PeminjamanSaya.jsx        # Riwayat peminjaman siswa
│   │   │   ├── DataBuku.jsx + .css       # Grid kartu; adaptif per role (+Pinjam)
│   │   │   ├── BukuForm.jsx + .css       # Tambah / Edit buku + preview 3D
│   │   │   ├── KategoriBuku.jsx          # Katalog per kategori
│   │   │   ├── Laporan.jsx               # Rekap + unduh Excel / PDF
│   │   │   ├── KatalogPustakawan.jsx     # Katalog tabel + ringkasan
│   │   │   ├── KatalogPetugas.jsx        # Kontrol kelengkapan data
│   │   │   ├── KatalogUmum.jsx           # Katalog publik (baca saja)
│   │   │   ├── ApiEndpoint.jsx           # Dokumentasi JSON API + "Coba"
│   │   │   └── Katalog*.css              # Style halaman katalog
│   │   ├── App.jsx                       # Daftar route (guard per role)
│   │   ├── main.jsx
│   │   └── index.css                     # Style dasar seluruh halaman
│   ├── .env                              # VITE_API_URL
│   └── index.html
│
└──README.md
```

---

## 2. Cara Menjalankan

### Prasyarat
- XAMPP (Apache & MySQL/MariaDB sudah berjalan)
- PHP 8.2+, Composer, Node.js 18+

### A. Siapkan Database

**Cara 1 — Import file SQL (via phpMyAdmin):**

Buka `http://localhost/phpmyadmin` → pilih **Import** → pilih file
`database/db_perpus_api.sql` → **Go**. Database `db_perpus_api`
berisi 12 data buku, 5 data peminjaman contoh, plus akun
admin / petugas / siswa akan langsung tersedia.

**Cara 2 — Otomatis (Laravel migration + seeder):**

```bash
# dari folder backend/
composer install
php artisan migrate:fresh --seed
```

> Bila database sudah dibuat sebelum versi fitur sampul, jalankan
> `php artisan migrate` (migrasi kolom `cover`, `role`, dan tabel `peminjaman`).

### B. Jalankan Backend (port 8000)

```bash
cd backend
php artisan serve
```

API tersedia di `http://localhost:8000/api`

### C. Jalankan Frontend (port 5173)

```bash
cd frontend
npm install
npm run dev
```

Aplikasi terbuka di `http://localhost:5173`

### Login (3 halaman terpisah)

| Role    | Halaman login      | Username  | Password    |
|---------|--------------------|-----------|-------------|
| Admin   | `http://localhost:5173/login`         | `admin`   | `admin123`  |
| Petugas | `http://localhost:5173/login/petugas` | `petugas` | `petugas123` |
| Siswa   | `http://localhost:5173/login/siswa`   | `siswa`   | `siswa123`  |

Daftar akun baru (siswa/petugas): `http://localhost:5173/register`.

> **Catatan:** bila username terisi dengan akun berbeda dari halaman login
> yang dibuka, server menolak dengan pesan
> *"Akun ini terdaftar sebagai X, bukan Y — silakan gunakan halaman login X."*

---

## 3. Daftar API (JSON)

### Publik (tanpa token)

| Method | Endpoint                 | Keterangan                              |
|--------|--------------------------|-----------------------------------------|
| POST   | `/api/register`          | Daftar akun baru (`siswa`/`petugas`) → token + auto login |
| POST   | `/api/login`             | Login (opsional `role` untuk validasi halaman login) |
| GET    | `/api/buku`              | Semua data buku (`?q=` cari)            |
| GET    | `/api/buku/{id}`         | 1 data buku                             |
| GET    | `/api/buku/{id}/cover`   | Gambar sampul (JPG/PNG/WEBP)            |

### Siswa (`role:siswa`)

| Method | Endpoint                 | Keterangan                              |
|--------|--------------------------|-----------------------------------------|
| POST   | `/api/peminjaman`        | Ajukan pinjam buku → status `menunggu`  |
| GET    | `/api/peminjaman/saya`   | Riwayat peminjaman milik sendiri + ringkasan |

### Petugas & Admin (`role:petugas,admin`)

| Method | Endpoint                       | Keterangan                            |
|--------|--------------------------------|---------------------------------------|
| GET    | `/api/peminjaman`              | Semua pengajuan (+ filter `?status=`) |
| PATCH  | `/api/peminjaman/{id}/setujui` | `menunggu` → `dipinjam` (tanggal pinjam = hari ini, kembali = +7 hari) |
| PATCH  | `/api/peminjaman/{id}/kembali` | `dipinjam` → `dikembalikan`           |

### Admin (`role:admin`)

| Method | Endpoint                 | Keterangan                              |
|--------|--------------------------|-----------------------------------------|
| POST   | `/api/buku`              | Tambah buku                             |
| PUT    | `/api/buku/{id}`         | Edit buku (+ opsional `cover`)          |
| DELETE | `/api/buku/{id}`         | Hapus buku (sampul ikut dihapus)        |
| GET    | `/api/statistik`         | Statistik dashboard                     |
| GET    | `/api/export/excel`      | Unduh Excel                             |
| GET    | `/api/export/pdf`        | Unduh PDF                               |

### Semua role login

| Method | Endpoint                 | Keterangan                              |
|--------|--------------------------|-----------------------------------------|
| GET    | `/api/me`                | Profil user login (termasuk `role`)     |
| POST   | `/api/logout`            | Logout (cabut token)                    |

Contoh request dengan token:

```
Authorization: Bearer 1|xxxxxxxxxxxxxxxx
Content-Type: application/json
```

### Contoh body register

```json
{
  "name": "Budi Santoso",
  "username": "budi",
  "email": "budi@siswa.test",
  "password": "rahasia123",
  "password_confirmation": "rahasia123",
  "role": "siswa"
}
```

`role` hanya boleh `siswa` atau `petugas` (akun admin dibuat lewat seeder).

### Contoh body ajukan peminjaman

```json
{ "buku_id": 1, "catatan": "Untuk tugas sastra" }
```

### Contoh body tambah / edit buku

```json
{
  "kode_buku": "BK013",
  "judul": "Laravel untuk Pemula",
  "penulis": "Budi Santoso",
  "kategori": "Teknologi",
  "tahun_terbit": 2025,
  "penerbit": "Informatika"
}
```

Field **`cover`** bersifat opsional dan hanya diproses bila dikirim:

| Nilai `cover`        | Efek                                        |
|----------------------|---------------------------------------------|
| tidak dikirim        | sampul tidak diubah                         |
| `data:image/...;base64,...` | gambar diganti (JPG/PNG/WEBP, maks 3MB) |
| `""` (string kosong) | sampul dihapus, file lama ikut dihapus      |

---

## 4. Format Tabel Data Buku

| NO / ID | KODE BUKU | JUDUL | PENULIS | KATEGORI | TAHUN TERBIT | PENERBIT |
|---------|-----------|-------|---------|----------|--------------|----------|

Halaman frontend:

| Route                   | Role    | Halaman                                    |
|-------------------------|---------|--------------------------------------------|
| `/login`                | -       | Login **admin** (beranimasi)               |
| `/login/petugas`        | -       | Login **petugas**                          |
| `/login/siswa`          | -       | Login **siswa**                            |
| `/register`             | -       | Daftar akun siswa / petugas (auto login)   |
| `/dashboard`            | admin   | Discover: statistik, tren, donut, terbaru   |
| `/dashboard-petugas`    | petugas | Pengajuan menunggu + alur kerja petugas    |
| `/dashboard-siswa`      | siswa   | Ringkasan peminjaman sendiri + cara pinjam |
| `/buku`                 | semua   | Daftar buku (admin kelola, siswa **Pinjam**) |
| `/buku/tambah`          | admin   | Tambah buku (form 2 kolom + preview 3D)     |
| `/buku/{id}/edit`       | admin   | Edit buku (form 2 kolom + preview 3D)       |
| `/kategori`             | admin   | Kategori Buku                               |
| `/laporan`              | admin   | Laporan Buku + unduh Excel / PDF            |
| `/katalog/pustakawan`   | admin   | Katalog Pustakawan (tabel + ringkasan)      |
| `/katalog/petugas`      | admin   | Katalog Petugas Perpustakaan (kelengkapan)  |
| `/katalog/umum`         | admin   | Katalog Pustakawan Umum (katalog publik)    |
| `/endpoint`             | admin   | JSON API Endpoint + tombol **Coba**         |
| `/peminjaman`           | petugas, admin | Pengajuan: **Setujui Pinjam** & **Proses Kembali** |
| `/peminjaman-saya`      | siswa   | Riwayat peminjaman + filter status         |

Menu sidebar per role:

- **Admin** — Discover, Data Buku, Kategori Buku, Laporan Buku, Peminjaman Buku,
  Katalog Pustakawan, Katalog Petugas Perpustakaan, Katalog Pustakawan Umum,
  JSON API Endpoint, Keluar (Logout).
- **Petugas** — Dashboard Petugas, Data Buku (lihat saja), Peminjaman Buku,
  Keluar (Logout).
- **Siswa** — Dashboard Siswa, Data Buku (+ tombol Pinjam), Peminjaman Saya,
  Keluar (Logout).

---

## 5. Pengujian Aplikasi

### A. Automated Test (PHPUnit)

```bash
cd backend
php artisan test
```

```
Tests:  60 passed (160 assertions)
```

Mencakup 41 test API lama: login (benar/salah), CRUD (create/read/update/delete),
proteksi token (401), validasi field, duplikasi kode buku, statistik,
export Excel/PDF, CORS, serta unggah/hapus/validasi gambar sampul.

Ditambah 19 test fitur 3 role (`tests/Feature/RolePeminjamanTest.php`):
register (berhasil/ditolak role admin/duplikat), login per role +
mismatch halaman login, guard `role:` (siswa/petugas 403 pada route salah),
alur peminjaman lengkap (ajukan → duplikat aktif ditolak → setujui →
kembali), pemisahan data antar siswa, serta admin dapat memproses
peminjaman seperti petugas.

### B. Pengujian Manual (curl / browser)

| No | Pengujian                         | Hasil  |
|----|-----------------------------------|--------|
| 1  | `GET /api/buku` → 12 data, 200    | LULUS  |
| 2  | Login benar → 200 + token         | LULUS  |
| 3  | Login salah → 422 "Username atau password salah." | LULUS |
| 4  | CRUD tanpa token → 401 JSON       | LULUS  |
| 5  | Tambah buku → 201                 | LULUS  |
| 6  | Edit buku → 200, data berubah     | LULUS  |
| 7  | Hapus buku → 200, data hilang     | LULUS  |
| 8  | Kode buku duplikat → 422          | LULUS  |
| 9  | Field kosong / tahun salah → 422 (Bahasa Indonesia) | LULUS |
| 10 | `GET /api/statistik` → total, per kategori, per tahun, per penerbit | LULUS |
| 11 | Export Excel → 200, XML valid, nama file `.xls` | LULUS |
| 12 | Export PDF → 200, file `%PDF` valid | LULUS |
| 13 | Logout → token dicabut, request ulang 401 | LULUS |
| 14 | CORS preflight dari `localhost:5173` → 204 + header izin | LULUS |
| 15 | `npm run build` sukses tanpa error | LULUS |
| 16 | Import `database/db_perpus_api.sql` → 12 buku + admin | LULUS |
| 17 | Edit buku + unggah sampul → `cover` tersimpan di storage | LULUS |
| 18 | `GET /api/buku/{id}/cover` → 200 `image/png` (tanpa token) | LULUS |
| 19 | Sampul format salah / >3MB → 422 Bahasa Indonesia | LULUS |
| 20 | Hapus sampul (`cover: ""`) → field null + file ikut terhapus, gambar 404 | LULUS |
| 21 | `POST /api/register` → 201 + token + auto login, `role` benar | LULUS |
| 22 | Register `role: admin` → 422 (hanya siswa/petugas) | LULUS |
| 23 | Login pakai halaman role salah → 422 "Akun ini terdaftar sebagai X, bukan Y..." | LULUS |
| 24 | Siswa `POST /api/peminjaman` → 201 status `menunggu` | LULUS |
| 25 | Ajukan buku yang masih aktif → 422 | LULUS |
| 26 | Petugas `PATCH .../setujui` → `dipinjam`, tanggal pinjam hari ini, kembali +7 hari | LULUS |
| 27 | Petugas `PATCH .../kembali` → `dikembalikan` + tanggal pengembalian | LULUS |
| 28 | Siswa buka `GET /api/peminjaman` (route petugas) → 403 | LULUS |
| 29 | Siswa / petugas `POST /api/buku` (route admin) → 403 | LULUS |
| 30 | Smoke SSR: `/login`, `/login/petugas`, `/login/siswa`, `/register` ter-render | LULUS |

### Bug yang ditemukan & diperbaiki saat pengujian

1. **`preg_match(): No ending delimiter '/'`** — aturan regex validasi
   `kode_buku` belum ditutup dengan `/`. Diperbaiki menjadi
   `regex:/^[A-Za-z0-9]+$/`.
2. **`Route [login] not defined` (HTTP 500)** — request API tanpa token
   di-redirect ke route login web yang tidak ada. Diperbaiki dengan
   `redirectGuestsTo()` di `bootstrap/app.php` sehingga balasan menjadi
   JSON 401.
3. **Pesan error berbahasa Inggris** — ditambahkan `lang/id/` agar pesan
   validasi dan login berbahasa Indonesia.
4. **Status login di-cache di `ProtectedRoute`** — guard route menyimpan
   `isAuthenticated` ke state sekali saat mount, sehingga route tidak ikut
   terkunci ketika token dicabut. Diperbaiki dengan membaca langsung dari
   context.
5. **UI tetap "login" setelah token 401** — `client.js` menghapus token dari
   `localStorage` tetapi state React tidak di-reset. Diperbaiki dengan event
   `perpus:session-cleared` yang didengar oleh `AuthContext`.
6. **CSS halaman login tertimpa `index.css`** — urutan impor `main.jsx`
   membuat stylesheet global dimuat belakangan sehingga menang saat
   spesifisitas sama. Diperbaiki dengan memindahkan `import './index.css'`
   ke paling atas.
7. **Foreign key `peminjaman` gagal dibuat (`errno: 150`)** —
   `foreignId('buku_id')->constrained()` menebak nama tabel `bukus`, padahal
   model `Buku` memakai `$table = 'buku'`. Diperbaiki dengan
   `constrained('buku')` secara eksplisit.

---

## 6. Catatan Teknis

- Token disimpan di `localStorage` React dan dikirim otomatis pada setiap
  request lewat header `Authorization: Bearer ...`.
- Konfigurasi CORS ada di `backend/config/cors.php` — jika port frontend
  berbeda, tambahkan origin-nya ke daftar `allowed_origins`.
- Export PDF memakai `barryvdh/laravel-dompdf` dengan kertas A4 landscape.
- Export Excel memakai format SpreadsheetML (XML) yang langsung terbuka di
  Microsoft Excel tanpa library tambahan.
- Gambar sampul dikirim sebagai **data URL base64** dalam JSON (maks 3MB,
  tipe JPG/PNG/WEBP), disimpan di `backend/storage/app/private/cover/`, lalu
  disajikan lewat `GET /api/buku/{id}/cover` — sehingga tidak memerlukan
  symlink `storage:link` (yang sering bermasalah di Windows).
- Nama file sampul dibuat dari kode buku + waktu + acak, dan otomatis
  dihapus saat sampul diganti atau buku dihapus.
- Pratinjau 3D memakai `transform` CSS murni (`preserve-3d`) — tanpa library
  tambahan — dan dapat diputar dengan klik + geser.
- Untuk reset database ke kondisi awal:
  ```bash
  cd backend
  php artisan migrate:fresh --seed
  ```
- Menjalankan seluruh automated test:
  ```bash
  cd backend
  php artisan test
  ```
- Flow peminjaman buku mengikuti 3 status persis:
  **`menunggu`** (siswa mengajukan) → **`dipinjam`** (petugas menyetujui;
  `tanggal_pinjam` = hari ini, `tanggal_kembali` = +7 hari) →
  **`dikembalikan`** (petugas memproses pengembalian).
  Tidak ada status "ditolak".
- Middleware role terdaftar dengan alias `role` di `bootstrap/app.php`
  (`role:admin`, `role:siswa`, `role:petugas,admin`).
- File SQL `database/db_perpus_api.sql` adalah hasil dump langsung dari
  MySQL sehingga isinya sama persis dengan struktur yang dipakai Laravel
  (termasuk kolom `users.role` dan tabel `peminjaman`).
