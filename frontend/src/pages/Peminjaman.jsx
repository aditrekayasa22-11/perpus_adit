import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import Cover from '../components/Cover'
import { apiBase } from '../api/client'
import { initials } from '../config/site'
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
 * Halaman Peminjaman (petugas & admin): daftar semua pengajuan,
 * proses persetujuan (menunggu → dipinjam) dan pengembalian
 * (dipinjam → dikembalikan).
 */
export default function Peminjaman() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [tab, setTab] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api('/peminjaman')
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

  // Pesan sukses hilang sendiri
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

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

  const handleSetujui = async (row) => {
    if (!window.confirm(`Setujui peminjaman "${row.buku?.judul}" oleh ${row.user?.name}?`)) return

    setBusy(`s-${row.id}`)
    setError('')
    try {
      const res = await api(`/peminjaman/${row.id}/setujui`, { method: 'PATCH' })
      setNotice(res.message)
      await load()
    } catch (err) {
      setError(err.message)
      window.setTimeout(() => setError(''), 4000)
    } finally {
      setBusy('')
    }
  }

  const handleKembali = async (row) => {
    if (!window.confirm(`Proses pengembalian "${row.buku?.judul}" dari ${row.user?.name}?`)) return

    setBusy(`k-${row.id}`)
    setError('')
    try {
      const res = await api(`/peminjaman/${row.id}/kembali`, { method: 'PATCH' })
      setNotice(res.message)
      await load()
    } catch (err) {
      setError(err.message)
      window.setTimeout(() => setError(''), 4000)
    } finally {
      setBusy('')
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Peminjaman Buku</h1>
          <p>
            Lihat pengajuan peminjaman siswa — setujui pinjaman dan proses pengembalian buku
          </p>
        </div>
      </div>

      {/* Ringkasan alur kerja */}
      <div className="stat-grid">
        <div className="stat-card tone-orange">
          <span className="stat-ico">⏳</span>
          <div className="stat-body">
            <strong className="stat-value">{counts.menunggu}</strong>
            <span className="stat-label">Menunggu Proses</span>
            <small className="stat-sub">pengajuan baru</small>
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
            <span className="stat-label">Sudah Dikembalikan</span>
            <small className="stat-sub">riwayat selesai</small>
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

      {notice && <div className="alert alert-success">{notice}</div>}
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
          <h2>{tab ? `Peminjaman — ${STATUS_LABEL[tab]}` : 'Semua Peminjaman'}</h2>
          <span className="panel-chip">{filtered.length} data</span>
        </div>

        {loading ? (
          <div className="loading">Memuat data peminjaman...</div>
        ) : filtered.length === 0 ? (
          <div className="loading">Belum ada data peminjaman dengan status ini.</div>
        ) : (
          <div className="table-wrap">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th className="center">NO</th>
                  <th>SISWA</th>
                  <th>BUKU</th>
                  <th>DIAJUKAN</th>
                  <th>BATAS KEMBALI</th>
                  <th>STATUS</th>
                  <th className="center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
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
                          src={
                            row.buku?.cover ? `${apiBase}/buku/${row.buku_id}/cover` : ''
                          }
                        />
                        <span className="cell-book-text">
                          <strong title={row.buku?.judul}>{row.buku?.judul}</strong>
                          <small>{row.buku?.kode_buku}</small>
                          {row.catatan && (
                            <span className="pm-note" title={row.catatan}>
                              “{row.catatan}”
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td>
                      {fmtDate(row.created_at)}
                      <span className="pm-date">
                        Dipinjam: {fmtDate(row.tanggal_pinjam)}
                      </span>
                    </td>
                    <td>
                      {row.tanggal_kembali ? fmtDate(row.tanggal_kembali) : '—'}
                      {row.tanggal_pengembalian && (
                        <span className="pm-date">
                          Kembali: {fmtDate(row.tanggal_pengembalian)}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`pm-status s-${row.status}`}>
                        {STATUS_LABEL[row.status] || row.status}
                      </span>
                    </td>
                    <td className="center pm-act">
                      {row.status === 'menunggu' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          disabled={busy === `s-${row.id}`}
                          onClick={() => handleSetujui(row)}
                        >
                          {busy === `s-${row.id}` ? 'Memproses...' : '✅ Setujui Pinjam'}
                        </button>
                      )}
                      {row.status === 'dipinjam' && (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          disabled={busy === `k-${row.id}`}
                          onClick={() => handleKembali(row)}
                        >
                          {busy === `k-${row.id}` ? 'Memproses...' : '↩ Proses Kembali'}
                        </button>
                      )}
                      {row.status === 'dikembalikan' && <span className="chip">Selesai</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Penjelasan alur */}
      <section className="panel">
        <div className="panel-head">
          <h2>Alur Proses</h2>
          <span className="panel-chip">3 tahap</span>
        </div>
        <div className="pm-flow">
          <div className="pm-flow-card">
            <strong>1. Menunggu ⏳</strong>
            <span>Siswa mengajukan pinjam buku dari halaman Daftar Buku.</span>
          </div>
          <div className="pm-flow-card" style={{ borderLeftColor: '#16a34a' }}>
            <strong>2. Dipinjam 📖</strong>
            <span>Petugas menyetujui — tanggal pinjam & batas kembali otomatis (+7 hari).</span>
          </div>
          <div className="pm-flow-card" style={{ borderLeftColor: '#7c3aed' }}>
            <strong>3. Dikembalikan ✅</strong>
            <span>Buku kembali — petugas menutup peminjaman, status jadi riwayat.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
