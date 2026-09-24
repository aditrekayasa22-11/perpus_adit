import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiBase } from '../api/client'
import Cover from '../components/Cover'
import { useAuth } from '../context/AuthContext'
import './Peminjaman.css'

const STATUS_LABEL = {
  menunggu: 'Menunggu',
  dipinjam: 'Dipinjam',
  dikembalikan: 'Dikembalikan',
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/**
 * Dashboard Siswa — ringkasan peminjaman milik sendiri + aksi cepat
 * (telusuri buku / ajukan pinjaman).
 */
export default function DashboardSiswa() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [totalBuku, setTotalBuku] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const [pinjam, buku] = await Promise.all([
          api('/peminjaman/saya'),
          api('/buku'),
        ])
        if (!alive) return
        setRows(pinjam.data)
        setTotalBuku(buku.total ?? buku.data?.length ?? 0)
        setError('')
      } catch (err) {
        if (alive) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const counts = { menunggu: 0, dipinjam: 0, dikembalikan: 0 }
  rows.forEach((r) => {
    if (counts[r.status] !== undefined) counts[r.status] += 1
  })

  const terbaru = rows.slice(0, 5)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard Siswa 👋</h1>
          <p>
            Halo, <b>{user?.name || user?.username}</b>! Telusuri daftar buku dan ajukan
            peminjamanmu di sini.
          </p>
        </div>
        <div className="toolbar">
          <Link to="/buku" className="btn btn-accent">
            📚 Daftar Buku
          </Link>
          <Link to="/peminjaman-saya" className="btn btn-ghost">
            📦 Peminjaman Saya
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Ringkasan */}
      <div className="stat-grid">
        <div className="stat-card tone-orange">
          <span className="stat-ico">⏳</span>
          <div className="stat-body">
            <strong className="stat-value">{counts.menunggu}</strong>
            <span className="stat-label">Menunggu</span>
            <small className="stat-sub">diproses petugas</small>
          </div>
        </div>
        <div className="stat-card tone-blue">
          <span className="stat-ico">📖</span>
          <div className="stat-body">
            <strong className="stat-value">{counts.dipinjam}</strong>
            <span className="stat-label">Dipinjam</span>
            <small className="stat-sub">sedang dipinjam</small>
          </div>
        </div>
        <div className="stat-card tone-green">
          <span className="stat-ico">✅</span>
          <div className="stat-body">
            <strong className="stat-value">{counts.dikembalikan}</strong>
            <span className="stat-label">Dikembalikan</span>
            <small className="stat-sub">riwayat selesai</small>
          </div>
        </div>
        <div className="stat-card tone-purple">
          <span className="stat-ico">📚</span>
          <div className="stat-body">
            <strong className="stat-value">{totalBuku}</strong>
            <span className="stat-label">Koleksi Buku</span>
            <small className="stat-sub">siap dipinjam</small>
          </div>
        </div>
      </div>

      {/* Peminjaman terbaru */}
      <section className="panel">
        <div className="panel-head">
          <h2>Peminjaman Terbaru</h2>
          <Link to="/peminjaman-saya" className="panel-chip" style={{ textDecoration: 'none' }}>
            Lihat semua →
          </Link>
        </div>

        {loading ? (
          <div className="loading">Memuat data...</div>
        ) : terbaru.length === 0 ? (
          <div className="loading">
            Kamu belum mengajukan peminjaman.{' '}
            <Link to="/buku" style={{ color: 'var(--blue-dark)', fontWeight: 700 }}>
              Telusuri daftar buku →
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th className="center">NO</th>
                  <th>BUKU</th>
                  <th>DIAJUKAN</th>
                  <th>BATAS KEMBALI</th>
                  <th className="center">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {terbaru.map((row, i) => (
                  <tr key={row.id}>
                    <td className="center">{i + 1}</td>
                    <td>
                      <span className="cell-book">
                        <Cover
                          kategori={row.buku?.kategori}
                          size="sm"
                          src={row.buku?.cover ? `${apiBase}/buku/${row.buku_id}/cover` : ''}
                        />
                        <span className="cell-book-text">
                          <strong title={row.buku?.judul}>{row.buku?.judul}</strong>
                          <small>{row.buku?.kode_buku}</small>
                        </span>
                      </span>
                    </td>
                    <td>{fmtDate(row.created_at)}</td>
                    <td>{fmtDate(row.tanggal_kembali)}</td>
                    <td className="center">
                      <span className={`pm-status s-${row.status}`}>
                        {STATUS_LABEL[row.status] || row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Alur singkat */}
      <section className="panel">
        <div className="panel-head">
          <h2>Cara Meminjam Buku</h2>
        </div>
        <div className="pm-flow">
          <div className="pm-flow-card" style={{ borderLeftColor: '#ef4444' }}>
            <strong>1. Pilih Buku 📚</strong>
            <span>Buka menu Daftar Buku, cari judul yang kamu inginkan.</span>
          </div>
          <div className="pm-flow-card" style={{ borderLeftColor: '#b45309' }}>
            <strong>2. Ajukan Pinjam 📖</strong>
            <span>Klik tombol “Pinjam” pada kartu buku — status jadi Menunggu.</span>
          </div>
          <div className="pm-flow-card" style={{ borderLeftColor: '#16a34a' }}>
            <strong>3. Diproses Petugas ✅</strong>
            <span>Petugas menyetujui → buku Dipinjam → kembalikan sebelum batas waktu.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
