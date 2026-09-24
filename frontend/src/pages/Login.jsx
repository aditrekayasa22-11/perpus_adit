import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { homeFor, SCHOOL } from '../config/site'
import { useAuth } from '../context/AuthContext'
import './Login.css'

const WELCOME_TEXT = 'Welcome to Perpustakaan Buku'

const REMEMBER_KEY = 'perpus_remember_user'
const USERNAME_KEY = 'perpus_form_username'

const FLOAT_BOOKS = [
  { cls: 'fb-a', char: '📖' },
  { cls: 'fb-b', char: '📚' },
  { cls: 'fb-c', char: '📕' },
  { cls: 'fb-d', char: '📗' },
  { cls: 'fb-e', char: '✏️' },
  { cls: 'fb-f', char: '🔖' },
]

/** Teks & gaya khusus tiap role. */
const ROLE_META = {
  admin: {
    icon: '🔐',
    sub: 'Masuk ke dashboard admin',
    hint: 'Default: admin / admin123',
    heroKicker: 'Perpustakaan Sekolah',
    heroSub:
      'Platform digital katalog buku — telusuri koleksi, kelola data perpustakaan, dan pantau statistik dari satu dashboard admin.',
    features: [
      { icon: '📖', label: 'Kelola data buku & sampul (CRUD)' },
      { icon: '📊', label: 'Dashboard statistik real-time' },
      { icon: '⬇️', label: 'Export laporan Excel & PDF' },
      { icon: '🔐', label: 'Autentikasi token (Laravel Sanctum)' },
    ],
  },
  petugas: {
    icon: '🧑‍🏫',
    sub: 'Masuk ke dashboard petugas',
    hint: 'Default: petugas / petugas123',
    heroKicker: 'Layanan Petugas',
    heroSub:
      'Masuk sebagai petugas perpustakaan — lihat pengajuan peminjaman siswa, proses peminjaman, dan catat pengembalian buku.',
    features: [
      { icon: '👀', label: 'Melihat pengajuan peminjaman siswa' },
      { icon: '✅', label: 'Memproses peminjaman buku' },
      { icon: '↩️', label: 'Memproses pengembalian buku' },
      { icon: '🔐', label: 'Autentikasi token (Laravel Sanctum)' },
    ],
  },
  siswa: {
    icon: '🎓',
    sub: 'Masuk ke dashboard siswa',
    hint: 'Default: siswa / siswa123',
    heroKicker: 'Layanan Siswa',
    heroSub:
      'Masuk sebagai siswa — telusuri daftar buku, pilih dan ajukan pinjaman, lalu pantau status peminjamanmu.',
    features: [
      { icon: '📚', label: 'Telusuri daftar buku perpustakaan' },
      { icon: '📖', label: 'Ajukan pinjam buku secara online' },
      { icon: '📦', label: 'Pantau status: menunggu, dipinjam, dikembalikan' },
      { icon: '🔐', label: 'Autentikasi token (Laravel Sanctum)' },
    ],
  },
}

/** Daftar link pindah role + register di bawah form. */
const ROLE_LINKS = [
  { role: 'admin', to: '/login', label: 'Admin' },
  { role: 'petugas', to: '/login/petugas', label: 'Petugas' },
  { role: 'siswa', to: '/login/siswa', label: 'Siswa' },
]

/**
 * Halaman Login — latar bergerak + tulisan beranimasi huruf demi huruf.
 *
 * @param {{ role?: 'admin'|'petugas'|'siswa' }} props
 *   Route: /login (admin), /login/petugas, /login/siswa.
 */
export default function Login({ role = 'admin' }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const userRef = useRef(null)

  const meta = ROLE_META[role] || ROLE_META.admin

  const [username, setUsername] = useState(() => localStorage.getItem(USERNAME_KEY) || '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(() => localStorage.getItem(REMEMBER_KEY) === '1')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const focusUsername = () => userRef.current?.focus()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Username dan password wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const data = await login(username, password, role)

      if (remember) {
        localStorage.setItem(REMEMBER_KEY, '1')
        localStorage.setItem(USERNAME_KEY, username)
      } else {
        localStorage.removeItem(REMEMBER_KEY)
        localStorage.removeItem(USERNAME_KEY)
      }

      // Kembali ke halaman asal bila ada, atau ke dashboard sesuai role akun.
      const home = location.state?.from?.pathname || homeFor(data?.user?.role)
      navigate(home, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tickerItem = (key) => (
    <span className="lp-ticker-item" key={key}>
      ✦ Welcome to Perpustakaan Buku
    </span>
  )

  return (
    <div className="login-page">
      {/* ---------- Latar bergerak ---------- */}
      <div className="lp-bg" aria-hidden="true">
        <span className="lp-blob lp-blob-a" />
        <span className="lp-blob lp-blob-b" />
        <span className="lp-blob lp-blob-c" />
        <span className="lp-grid-lines" />
        {FLOAT_BOOKS.map((b) => (
          <span className={`lp-float-book ${b.cls}`} key={b.cls}>
            {b.char}
          </span>
        ))}
      </div>

      {/* ---------- Bilah atas ---------- */}
      <header className="lp-top">
        <div className="lp-logo">
          <span className="lp-logo-mark">📚</span>
          <span className="lp-logo-text">
            <strong>PERPUSTAKAAN DIGITAL</strong>
            <small>{SCHOOL.name}</small>
          </span>
        </div>

        <button type="button" className="lp-top-btn" onClick={focusUsername}>
          Lihat Katalog →
        </button>
      </header>

      <div className="lp-grid">
        {/* ---------- Panel kiri: identitas sekolah ---------- */}
        <aside className="lp-brand">
          <span className="lp-brand-badge">Masa Pelajaran {SCHOOL.year}</span>

          <div className="lp-brand-logo">
            <span>📚</span>
          </div>

          <h2 className="lp-brand-name">
            PERPUSTAKAAN
            <br />
            DIGITAL
          </h2>
          <p className="lp-brand-school">{SCHOOL.name}</p>

          <ul className="lp-brand-stats">
            <li>
              <strong>12+</strong>
              <span>Judul Buku</span>
            </li>
            <li>
              <strong>6</strong>
              <span>Kategori</span>
            </li>
            <li>
              <strong>24/7</strong>
              <span>Akses JSON API</span>
            </li>
          </ul>

          <p className="lp-brand-note">📖 Platform digital katalog buku sekolah</p>
        </aside>

        {/* ---------- Panel tengah: judul beranimasi ---------- */}
        <section className="lp-hero">
          <span className="lp-kicker">{meta.heroKicker}</span>

          <h1 className="lp-title">
            {[...WELCOME_TEXT].map((char, i) => {
              const delay = 0.25 + i * 0.045
              return (
                <span
                  className="lp-char"
                  style={{ animationDelay: `${delay.toFixed(3)}s` }}
                  aria-hidden="true"
                  key={`${char}-${i}`}
                >
                  <span
                    className="lp-char-inner"
                    style={{ animationDelay: `${(delay + 1.9).toFixed(3)}s` }}
                  >
                    {char}
                  </span>
                </span>
              )
            })}
            <span className="lp-sr-only">{WELCOME_TEXT}</span>
          </h1>

          <p className="lp-sub">{meta.heroSub}</p>

          <div className="lp-ticker" aria-hidden="true">
            <div className="lp-ticker-track">
              <span className="lp-ticker-group">{[0, 1, 2, 3].map(tickerItem)}</span>
              <span className="lp-ticker-group">{[4, 5, 6, 7].map(tickerItem)}</span>
            </div>
          </div>

          <ul className="lp-features">
            {meta.features.map((f, i) => (
              <li key={f.label} style={{ animationDelay: `${1.5 + i * 0.12}s` }}>
                <span className="lp-feat-ico">{f.icon}</span>
                {f.label}
              </li>
            ))}
          </ul>

          <div className="lp-note">
            <span>🔒 Token-based authentication</span>
            <span className="lp-dot">•</span>
            <span>Laravel Sanctum</span>
            <span className="lp-dot">•</span>
            <span>React 19</span>
          </div>
        </section>

        {/* ---------- Panel kanan: form login ---------- */}
        <section className="lp-panel">
          <form className="lp-card" onSubmit={handleSubmit}>
            <div className="lp-card-head">
              <span className="lp-card-ico">{meta.icon}</span>
              <div>
                <h1>Sign In {role === 'admin' ? '' : role === 'petugas' ? 'Petugas' : 'Siswa'}</h1>
                <p>{meta.sub}</p>
              </div>
            </div>

            <span className="lp-card-label">Selamat datang kembali 👋</span>

            {error && <div className="alert alert-error">{error}</div>}

            <label className="lp-field">
              <span>Username</span>
              <span className="lp-input">
                <span className="lp-input-ico" aria-hidden="true">
                  👤
                </span>
                <input
                  ref={userRef}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  autoFocus
                  autoComplete="username"
                />
              </span>
            </label>

            <label className="lp-field">
              <span>Password</span>
              <span className="lp-input">
                <span className="lp-input-ico" aria-hidden="true">
                  🔒
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </span>
            </label>

            <div className="lp-row">
              <label className="lp-check">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Ingat saya</span>
              </label>
              <span className="lp-hint-txt">{meta.hint}</span>
            </div>

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading && <span className="lp-spinner" aria-hidden="true" />}
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

            {/* Pindah halaman login role lain + daftar */}
            <nav className="lp-switch" aria-label="Pilih halaman masuk">
              <span>Masuk sebagai:</span>
              {ROLE_LINKS.map((l) =>
                l.role === role ? (
                  <b key={l.role}>{l.label}</b>
                ) : (
                  <Link key={l.role} to={l.to}>
                    {l.label}
                  </Link>
                ),
              )}
            </nav>

            <p className="lp-alt-action">
              Belum punya akun?{' '}
              <Link to="/register" className="lp-alt-link">
                Daftar di sini
              </Link>
            </p>

            <p className="lp-card-foot">
              © {new Date().getFullYear()} {SCHOOL.short} · Aplikasi Data Buku v1.0.0
            </p>
          </form>
        </section>
      </div>

      <footer className="lp-foot">
        <span>{SCHOOL.agency}</span>
        <span>Tahun Pelajaran {SCHOOL.year}</span>
      </footer>
    </div>
  )
}
