/**
 * Identitas instansi & utilitas tampilan bersama.
 * Ubah nilai di sini bila nama sekolah / instansi berbeda.
 */
export const SCHOOL = {
  name: 'SMK PGRI 2 PONOROGO',
  short: 'MTS 1 DOLOPO',
  city: 'PURWOKERTO',
  agency: 'Dinas Pendidikan dan Kebudayaan Kabupaten Banyumas',
  year: '2026/2027',
  tagline: 'Sistem Katalog & Layanan Buku',
}

/** Inisial untuk avatar (maksimal 2 huruf). */
export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'A'

/* =========================================================
   Role & halaman terkait (admin | petugas | siswa)
   ========================================================= */

/** Label role untuk topbar / chip profil. */
export const ROLE_LABEL = {
  admin: 'Administrator',
  petugas: 'Petugas Perpustakaan',
  siswa: 'Siswa',
}

/** Jalur halaman login per role. */
export const LOGIN_PATH = {
  admin: '/login',
  petugas: '/login/petugas',
  siswa: '/login/siswa',
}

/** Dashboard (halaman utama) per role. */
export const HOME_PATH = {
  admin: '/dashboard',
  petugas: '/dashboard-petugas',
  siswa: '/dashboard-siswa',
}

/** Halaman tujuan setelah login berdasarkan role user. */
export const homeFor = (role) => HOME_PATH[role] || '/login'
