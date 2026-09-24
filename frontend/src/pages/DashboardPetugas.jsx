import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiBase } from '../api/client'
import Cover from '../components/Cover'
import { initials } from '../config/site'
import { useAuth } from '../context/AuthContext'
import './Peminjaman.css'

/**
 * Dashboard Petugas — ringkasan pengajuan peminjaman yang menunggu,
 * sedang dipinjam, dan pengembalian terbaru + alur kerja petugas.
 */
export default function DashboardPetugas() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await api('/peminjaman')
        if (alive) {
          setRows(res.data)
          setError('')
        }
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

  const menunggu = rows.filter((r) => r.status === 'menunggu')
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—'

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard Petugas 🧑‍🏫</h1>
          <p>
            Halo, <b>{user?.name || user?.username}</b>! Berikut pengajuan peminjaman yang
            menunggu prosesmu.
          </p>
        </div>
        <div className="toolbar">
          <Link to="/peminjaman" className="btn btn-accent">
            📥 Proses Peminjaman
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
            <span className="stat-label">Menunggu Proses</span>
            <small className="stat-sub">pengajuan masuk</small>
          </div>
        </div>
        <div className="stat-card tone-blue">
          <span className="stat-ico">📖</span>
          <div className="stat-body">
            <strong className="stat-value">{counts.dipinjam}</strong>
            <span className="stat-label">Sedang Dipinjam</span>
            <small className="stat-sub">belum kembali</small>
          </div>
        </div>
        <div className="stat-card tone-green">
          <span className="stat-ico">✅</span>
          <div className="stat-body">
            <strong className="stat-value">{counts.dikembalikan}</strong>
            <span className="stat-label">Dikembalikan</span>
            <small className="stat-sub">selesai diproses</small>
          </div>
        </div>
        <div className="stat-card tone-purple">
          <span className="stat-ico">📚</span>
          <div className="stat-body">
            <strong className="stat-value">{rows.length}</strong>
            <span className="stat-label">Total Peminjaman</span>
            <small className="stat-sub">semua status</small>
          </div>
        </div>
      </div>

      {/* Pengajuan menunggu */}
      <section className="panel">
        <div className="panel-head">
          <h2>Pengajuan Menunggu Proses</h2>
          <Link to="/peminjaman" className="panel-chip" style={{ textDecoration: 'none' }}>
            Kelola semua →
          </Link>
        </div>

        {loading ? (
          <div className="loading">Memuat data peminjaman...</div>
        ) : menunggu.length === 0 ? (
          <div className="loading">Tidak ada pengajuan yang menunggu. Semua beres! 🎉</div>
        ) : (
          <div className="table-wrap">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th className="center">NO</th>
                  <th>SISWA</th>
                  <th>BUKU</th>
                  <th>DIAJUKAN</th>
                  <th className="center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {menunggu.slice(0, 6).map((row, i) => (
                  <tr key={row.id}>
                    <td className="center">{i + 1}</td>
                    <td>
                      <span className="person">
                        <span className="avatar xs">{initials(row.user?.name)}</span>
                        <span className="cell-book-text">
                          <strong>{row.user?.name}</strong>
                          <small>@{row.user?.username}</small>
                        </span>
                      </span>
                    </td>
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
                    <td className="center">
                      <Link to="/peminjaman" className="btn btn-sm btn-success">
                        ✅ Proses
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Alur kerja petugas */}
      <section className="panel">
        <div className="panel-head">
          <h2>Alur Kerja Petugas</h2>
        </div>
        <div className="pm-flow">
          <div className="pm-flow-card" style={{ borderLeftColor: '#ef4444' }}>
            <strong>1. Lihat Pengajuan 👀</strong>
            <span>Pantau pengajuan peminjaman siswa berstatus Menunggu.</span>
          </div>
          <div className="pm-flow-card" style={{ borderLeftColor: '#16a34a' }}>
            <strong>2. Proses Peminjaman ✅</strong>
            <span>Setujui pinjaman — tanggal & batas kembali terisi otomatis.</span>
          </div>
          <div className="pm-flow-card" style={{ borderLeftColor: '#7c3aed' }}>
            <strong>3. Proses Pengembalian ↩️</strong>
            <span>Tandai buku kembali saat siswa mengembalikan pinjamannya.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
