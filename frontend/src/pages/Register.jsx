import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { homeFor, SCHOOL } from '../config/site'
import { useAuth } from '../context/AuthContext'
import './Login.css'
import './Register.css'

const FLOAT_BOOKS = [
  { cls: 'fb-a', char: '📖' },
  { cls: 'fb-b', char: '📚' },
  { cls: 'fb-c', char: '📕' },
  { cls: 'fb-d', char: '📗' },
  { cls: 'fb-e', char: '✏️' },
  { cls: 'fb-f', char: '🔖' },
]

const EMPTY = { name: '', username: '', email: '', password: '', password2: '', role: 'siswa' }

/**
 * Halaman Register — daftar ak baru (siswa / petugas),
 * lalu otomatis login dan diarahkan ke dashboard sesuai role.
 */
export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const { name, username, email, password, password2, role } = form

    if (!name || !username || !email || !password || !password2) {
      setError('Semua kolom wajib diisi.')
      return
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }
    if (password !== password2) {
      setError('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      const data = await register({
        name,
        username,
        email,
        password,
        password_confirmation: password2,
        role,
      })
      navigate(homeFor(data?.user?.role) || '/dashboard', { replace: true })
    } catch (err) {
      // Tampilkan pesan per-field bila tersedia, selain pesan utama.
      const first = err.errors ? Object.values(err.errors)[0]?.[0] : null
      setError(first || err.message)
    } finally {
      setLoading(false)
    }
  }

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

        <Link to="/login" className="lp-top-btn">
          ← Kembali Masuk
        </Link>
      </header>

      {/* ---------- Kartu register (tengah) ---------- */}
      <div className="rg-wrap">
        <form className="lp-card rg-card" onSubmit={handleSubmit}>
          <div className="lp-card-head">
            <span className="lp-card-ico">📝</span>
            <div>
              <h1>Daftar Akun</h1>
              <p>Buat akun siswa / petugas baru</p>
            </div>
          </div>

          <span className="lp-card-label">Bergabung dengan perpustakaan 📚</span>

          {error && <div className="alert alert-error">{error}</div>}

          <label className="lp-field">
            <span>Nama Lengkap</span>
            <span className="lp-input">
              <span className="lp-input-ico" aria-hidden="true">
                👤
              </span>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Contoh: Budi Santoso"
                autoFocus
                autoComplete="name"
              />
            </span>
          </label>

          <div className="rg-two">
            <label className="lp-field">
              <span>Username</span>
              <span className="lp-input">
                <span className="lp-input-ico" aria-hidden="true">
                  🪪
                </span>
                <input
                  type="text"
                  value={form.username}
                  onChange={set('username')}
                  placeholder="untuk login"
                  autoComplete="username"
                />
              </span>
            </label>

            <label className="lp-field">
              <span>Email</span>
              <span className="lp-input">
                <span className="lp-input-ico" aria-hidden="true">
                  ✉️
                </span>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="nama@email.com"
                  autoComplete="email"
                />
              </span>
            </label>
          </div>

          <label className="lp-field">
            <span>Saya mendaftar sebagai</span>
            <span className="lp-input">
              <span className="lp-input-ico" aria-hidden="true">
                🎭
              </span>
              <select value={form.role} onChange={set('role')} className="rg-select">
                <option value="siswa">Siswa</option>
                <option value="petugas">Petugas Perpustakaan</option>
              </select>
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
                value={form.password}
                onChange={set('password')}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
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

          <label className="lp-field">
            <span>Ulangi Password</span>
            <span className="lp-input">
              <span className="lp-input-ico" aria-hidden="true">
                🔑
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password2}
                onChange={set('password2')}
                placeholder="Sama dengan password"
                autoComplete="new-password"
              />
            </span>
          </label>

          <button type="submit" className="lp-submit" disabled={loading}>
            {loading && <span className="lp-spinner" aria-hidden="true" />}
            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>

          <p className="lp-alt-action">
            Sudah punya akun?{' '}
            <Link to="/login" className="lp-alt-link">
              Masuk di sini
            </Link>
          </p>

          <p className="rg-role-hint">
            Pilih halaman masuk sesuai peran: <Link to="/login">Admin</Link> ·{' '}
            <Link to="/login/petugas">Petugas</Link> · <Link to="/login/siswa">Siswa</Link>
          </p>

          <p className="lp-card-foot">
            © {new Date().getFullYear()} {SCHOOL.short} · Aplikasi Data Buku v1.0.0
          </p>
        </form>
      </div>

      <footer className="lp-foot">
        <span>{SCHOOL.agency}</span>
        <span>Tahun Pelajaran {SCHOOL.year}</span>
      </footer>
    </div>
  )
}
