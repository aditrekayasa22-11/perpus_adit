import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiBase } from '../api/client'
import Cover from '../components/Cover'
import './Peminjaman.css'

const TABS = [
  { key: '', label: 'Semua' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'dipinjam', label: 'Dipinjam' },
  { key: 'dikembalikan', label: 'Dikembalikan' },
]

const STATUS_LABEL = {
  menunggu: 'Menunggu',
  dipinjam: 'Dipinjam',
  dikembalikan: 'Dikembalikan',
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

/**
 * Halaman "Peminjaman Saya" (siswa): riwayat pengajuan milik sendiri
 * beserta status Menunggu / Dipinjam / Dikembalikan.
 */
export default function PeminjamanSaya() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api('/peminjaman/saya')
      setRows(res.data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Pemuat awal (dijeda sekejap supaya tidak memanggil setState
  // secara sinkron dari dalam effect)
  useEffect(() => {
    const timer = window.setTimeout(() => load(), 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const filtered = useMemo(
    () => (tab ? rows.filter((r) => r.status === tab) : rows),
    [rows, tab],
  )

  const counts = useMemo(() => {
    const c = { menunggu: 0, dipinjam: 0, dikembalikan: 0 }
    rows.forEach((r) => {
      if (c[r.status] !== undefined) c[r.status] += 1
    })
    return c
  }, [rows])

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Peminjaman Saya</h1>
          <p>Status peminjaman buku yang kamu ajukan — menunggu, dipinjam, atau dikembalikan</p>
        </div>
        <div className="toolbar">
          <Link to="/buku" className="btn btn-accent">
            📚 Cari Buku Lain
          </Link>
        </div>
      </div>

      {/* Ringkasan status */}
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
            <small className="stat-sub">sedang kamu baca</small>
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
            <strong className="stat-value">{rows.length}</strong>
            <span className="stat-label">Total Pengajuan</span>
            <small className="stat-sub">semua status</small>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Tab filter status */}
      <div className="pm-tabs" role="tablist" aria-label="Filter status peminjaman">
        {TABS.map((t) => (
          <button
            type="button"
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`pm-tab${tab === t.key ? ' is-on' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            <span className="n">{t.key ? counts[t.key] : rows.length}</span>
          </button>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{tab ? `Peminjaman — ${STATUS_LABEL[tab]}` : 'Semua Peminjaman Saya'}</h2>
          <span className="panel-chip">{filtered.length} data</span>
        </div>

        {loading ? (
          <div className="loading">Memuat peminjaman saya...</div>
        ) : filtered.length === 0 ? (
          <div className="loading">
            Belum ada peminjaman dengan status ini.{' '}
            <Link to="/buku" className="lp-alt-link" style={{ color: 'var(--blue-dark)' }}>
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
                  <th>TANGGAL PINJAM</th>
                  <th>BATAS KEMBALI</th>
                  <th>TGL KEMBALI</th>
                  <th className="center">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
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
                    <td>{fmtDate(row.tanggal_pinjam)}</td>
                    <td>{fmtDate(row.tanggal_kembali)}</td>
                    <td>{fmtDate(row.tanggal_pengembalian)}</td>
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

      {/* Keterangan singkat status */}
      <section className="panel">
        <div className="panel-head">
          <h2>Keterangan Status</h2>
        </div>
        <div className="pm-flow">
          <div className="pm-flow-card" style={{ borderLeftColor: '#b45309' }}>
            <strong>⏳ Menunggu</strong>
            <span>Pengajuanmu sedang ditunggu proses persetujuan oleh petugas.</span>
          </div>
          <div className="pm-flow-card">
            <strong>📖 Dipinjam</strong>
            <span>Pengajuan disetujui — buku wajib dikembalikan sebelum batas waktu.</span>
          </div>
          <div className="pm-flow-card" style={{ borderLeftColor: '#16a34a' }}>
            <strong>✅ Dikembalikan</strong>
            <span>Buku sudah kamu kembalikan dan diproses petugas. Selesai!</span>
          </div>
        </div>
      </section>
    </div>
  )
}
