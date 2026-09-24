import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LOGIN_PATH, ROLE_LABEL, SCHOOL, initials } from '../config/site'
import { useAuth } from '../context/AuthContext'
import './Layout.css'

/** Judul halaman untuk breadcrumb. */
const TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard-petugas': 'Dashboard Petugas',
  '/dashboard-siswa': 'Dashboard Siswa',
  '/buku': 'Data Buku',
  '/kategori': 'Kategori Buku',
  '/laporan': 'Laporan Buku',
  '/endpoint': 'JSON API Endpoint',
  '/peminjaman': 'Peminjaman Buku',
  '/peminjaman-saya': 'Peminjaman Saya',
  '/katalog/pustakawan': 'Katalog Pustakawan',
  '/katalog/petugas': 'Katalog Petugas Perpustakaan',
  '/katalog/umum': 'Katalog Pustakawan Umum',
}

const GROUPS = {
  dashboard: 'Dashboard',
  'dashboard-petugas': 'Dashboard',
  'dashboard-siswa': 'Dashboard',
  buku: 'Buku',
  kategori: 'Kategori',
  laporan: 'Laporan',
  endpoint: 'API',
  peminjaman: 'Peminjaman',
  'peminjaman-saya': 'Peminjaman',
  katalog: 'Katalog',
}

/**
 * Menu sidebar per role.
 * `roles` menentukan role mana yang boleh melihat item tersebut.
 */
const MENU = [
  // ---------- Admin ----------
  { to: '/dashboard', icon: '🧭', text: 'Discover', roles: ['admin'] },
  { to: '/buku', icon: '📚', text: 'Data Buku', roles: ['admin', 'petugas', 'siswa'] },
  { to: '/kategori', icon: '🏷️', text: 'Kategori Buku', roles: ['admin'] },
  { to: '/laporan', icon: '📊', text: 'Laporan Buku', roles: ['admin'] },
  { to: '/peminjaman', icon: '📥', text: 'Peminjaman Buku', roles: ['admin', 'petugas'] },

  // ---------- Petugas ----------
  { to: '/dashboard-petugas', icon: '🧑‍🏫', text: 'Dashboard Petugas', roles: ['petugas'] },

  // ---------- Siswa ----------
  { to: '/dashboard-siswa', icon: '🎓', text: 'Dashboard Siswa', roles: ['siswa'] },
  { to: '/peminjaman-saya', icon: '📦', text: 'Peminjaman Saya', roles: ['siswa'] },

  // ---------- Katalog & lainnya (admin) ----------
  { to: '/katalog/pustakawan', icon: '🧑‍🏫', text: 'Katalog Pustakawan', roles: ['admin'] },
  { to: '/katalog/petugas', icon: '🗂️', text: 'Katalog Petugas Perpustakaan', roles: ['admin'] },
  { to: '/katalog/umum', icon: '🌐', text: 'Katalog Pustakawan Umum', roles: ['admin'] },
  { to: '/endpoint', icon: '{ }', text: 'JSON API Endpoint', roles: ['admin'], code: true },
]

/** Kelompokkan item menu per label "Menu Utama" / "Katalog & Lainnya". */
function menuFor(role) {
  const visible = MENU.filter((m) => !m.roles || m.roles.includes(role))
  return [
    { label: 'Menu Utama', items: visible.filter((m) => !m.to.startsWith('/katalog') && m.to !== '/endpoint') },
    { label: 'Katalog & Lainnya', items: visible.filter((m) => m.to.startsWith('/katalog') || m.to === '/endpoint') },
  ].filter((g) => g.items.length > 0)
}

/** Susun breadcrumb { group / title } dari URL aktif. */
function useCrumb() {
  const { pathname } = useLocation()

  if (pathname.startsWith('/buku/')) {
    return { group: 'Buku', title: pathname.endsWith('/edit') ? 'Edit Buku' : 'Tambah Buku' }
  }

  const segment = pathname.split('/')[1] || 'dashboard'
  return {
    group: GROUPS[segment] || 'Beranda',
    title: TITLES[pathname] || 'Dashboard',
  }
}

/**
 * Shell aplikasi setelah login: sidebar gelap + topbar + konten halaman.
 */
export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { group, title } = useCrumb()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [query, setQuery] = useState('')
  // Logo sekolah di avatar profil; bila gagal dimuat, kembali ke inisial.
  const [logoOk, setLogoOk] = useState(true)

  const displayName = user?.name || user?.username || 'Admin'
  const avatarInitial = initials(displayName)
  const role = user?.role || 'admin'
  const roleLabel = ROLE_LABEL[role] || 'Administrator'
  const groups = menuFor(role)

  const handleLogout = async () => {
    if (!window.confirm('Yakin ingin keluar (logout)?')) return
    await logout()
    // Kembali ke halaman login sesuai role
    navigate(LOGIN_PATH[role] || '/login', { replace: true })
  }

  // Pencarian dari topbar → pindah ke halaman Data Buku dengan ?q=
  const handleSearch = (e) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/buku?q=${encodeURIComponent(q)}` : '/buku')
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="app-shell">
      {/* ---------------- Sidebar ---------------- */}
      <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">📚</span>
          <span className="brand-text">
            <strong>PerpusAdvisor</strong>
            <small>Sistem Perpustakaan</small>
          </span>
          <button
            type="button"
            className="side-close"
            onClick={closeSidebar}
            aria-label="Tutup menu"
          >
            ×
          </button>
        </div>

        <nav className="side-nav">
          {groups.map((g) => (
            <div key={g.label} className="side-group">
              <span className="side-label">{g.label}</span>
              {g.items.map((m) => (
                <NavLink to={m.to} className="side-link" onClick={closeSidebar} key={m.to}>
                  <span className={`side-ico${m.code ? ' side-ico-code' : ''}`}>
                    {m.code ? '{ }' : m.icon}
                  </span>
                  {m.text}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Kartu profil admin + tombol keluar */}
        <div className="side-user">
          {logoOk ? (
            <span className="side-av side-av-logo">
              <img
                src="/logo-smk-pgri2.png"
                alt="Logo sekolah"
                onError={() => setLogoOk(false)}
              />
            </span>
          ) : (
            <span className="side-av">{avatarInitial}</span>
          )}
          <span className="su-meta">
            <strong>{displayName}</strong>
            <small>{roleLabel}</small>
          </span>
          <button type="button" className="su-out" onClick={handleLogout} aria-label="Keluar">
            ⎋
          </button>
        </div>
        <span className="su-caption">Keluar (Logout)</span>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="side-backdrop"
          onClick={closeSidebar}
          aria-label="Tutup menu"
        />
      )}

      {/* ---------------- Utama ---------------- */}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-btn side-open"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              ☰
            </button>
            <div className="crumb">
              <b>{group}</b>
              <i aria-hidden="true">/</i>
              <span>{title}</span>
            </div>
          </div>

          <form className="topbar-search" onSubmit={handleSearch} role="search">
            <span className="search-ico" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari buku, penulis, penerbit..."
              aria-label="Cari buku"
            />
          </form>

          <div className="topbar-right">
            <div className="notif-wrap">
              <button
                type="button"
                className="icon-btn notif"
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifikasi"
                aria-expanded={notifOpen}
              >
                🔔
                <span className="notif-dot" />
              </button>
              {notifOpen && (
                <div className="notif-pop">
                  <strong>Notifikasi</strong>
                  <p>Belum ada notifikasi baru.</p>
                </div>
              )}
            </div>

            <div className="school-badge">
              <span className="sb-ico" aria-hidden="true">
                🏫
              </span>
              <span className="sb-text">
                <strong>{SCHOOL.name}</strong>
                <small>{SCHOOL.agency}</small>
              </span>
            </div>

            <div className="user-chip">
              {logoOk ? (
                <span className="avatar avatar-logo">
                  <img
                    src="/logo-smk-pgri2.png"
                    alt="Logo sekolah"
                    onError={() => setLogoOk(false)}
                  />
                </span>
              ) : (
                <span className="avatar">{avatarInitial}</span>
              )}
              <span className="user-meta">
                <strong>{displayName}</strong>
                <small>{roleLabel}</small>
              </span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>{SCHOOL.agency}</span>
          <span>Aplikasi Data Buku · Laravel 12 · React 19 · MariaDB</span>
        </footer>
      </div>
    </div>
  )
}
