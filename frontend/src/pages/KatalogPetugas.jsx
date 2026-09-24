import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiBase } from '../api/client'
import Cover from '../components/Cover'
import './KatalogMenu.css'

/**
 * Katalog Petugas Perpustakaan — kontrol kelengkapan data
 * (sampul buku & keterangan) untuk petugas perpustakaan.
 */
export default function KatalogPetugas() {
  const [buku, setBuku] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('semua')

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const res = await api('/buku')
        if (active) setBuku(res.data)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const lengkap = buku.filter((b) => b.cover).length
  const belum = buku.length - lengkap
  const persen = buku.length ? Math.round((lengkap / buku.length) * 100) : 0

  const rows = useMemo(() => {
    if (filter === 'lengkap') return buku.filter((b) => b.cover)
    if (filter === 'belum') return buku.filter((b) => !b.cover)
    return buku
  }, [buku, filter])

  const perKategori = useMemo(() => {
    const map = new Map()
    for (const b of buku) {
      const item = map.get(b.kategori) || { total: 0, lengkap: 0 }
      item.total += 1
      if (b.cover) item.lengkap += 1
      map.set(b.kategori, item)
    }
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total)
  }, [buku])

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Katalog Petugas Perpustakaan</h1>
          <p>Kontrol kelengkapan data &amp; sampul koleksi untuk petugas perpustakaan</p>
        </div>
        <div className="toolbar">
          <Link to="/buku" className="btn btn-dark">
            📚 Kelola Data Buku
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* --------- Kartu ringkasan --------- */}
      <div className="stat-grid">
        <div className="stat-card tone-blue">
          <span className="stat-ico">📚</span>
          <div className="stat-body">
            <strong className="stat-value">{buku.length}</strong>
            <span className="stat-label">Total Data</span>
          </div>
        </div>
        <div className="stat-card tone-green">
          <span className="stat-ico">🖼️</span>
          <div className="stat-body">
            <strong className="stat-value">{lengkap}</strong>
            <span className="stat-label">Sampul Lengkap</span>
            <small className="stat-sub">siap ditampilkan</small>
          </div>
        </div>
        <div className="stat-card tone-orange">
          <span className="stat-ico">⚠️</span>
          <div className="stat-body">
            <strong className="stat-value">{belum}</strong>
            <span className="stat-label">Belum Ada Sampul</span>
          </div>
        </div>
        <div className="stat-card tone-purple">
          <span className="stat-ico">📈</span>
          <div className="stat-body">
            <strong className="stat-value">{persen}%</strong>
            <span className="stat-label">Kelengkapan</span>
          </div>
        </div>
      </div>

      {/* --------- Progress kelengkapan --------- */}
      <section className="panel">
        <div className="panel-head">
          <h2>Progress Kelengkapan Sampul</h2>
          <span className="panel-chip">
            {lengkap} / {buku.length} buku
          </span>
        </div>

        <div className="kt-progress">
          <span className="kt-progress-rail">
            <i style={{ width: `${persen}%` }} />
          </span>
          <b>{persen}%</b>
        </div>
        <p className="kt-progress-note">
          Buku tanpa sampul tetap tampil di katalog dengan ikon kategori. Unggah gambar melalui
          halaman Edit Buku agar katalog terlihat lebih menarik.
        </p>
      </section>

      <div className="kp-layout">
        {/* --------- Daftar buku --------- */}
        <section className="panel">
          <div className="panel-head">
            <h2>Daftar Kontrol Buku</h2>
            <div className="kt-tabs">
              {[
                { key: 'semua', label: `Semua (${buku.length})` },
                { key: 'lengkap', label: `Lengkap (${lengkap})` },
                { key: 'belum', label: `Belum (${belum})` },
              ].map((t) => (
                <button
                  type="button"
                  key={t.key}
                  className={`kt-tab${filter === t.key ? ' is-on' : ''}`}
                  onClick={() => setFilter(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading">Memuat data...</div>
          ) : rows.length === 0 ? (
            <p className="center empty">Tidak ada data pada filter ini.</p>
          ) : (
            <ul className="kt-list">
              {rows.map((row, i) => (
                <li className="kt-item" key={row.id}>
                  <span className="kt-no">{i + 1}</span>

                  <Cover
                    kategori={row.kategori}
                    size="sm"
                    src={row.cover ? `${apiBase}/buku/${row.id}/cover` : ''}
                  />

                  <span className="kt-body">
                    <strong title={row.judul}>{row.judul}</strong>
                    <small>
                      <code>{row.kode_buku}</code> · {row.penulis} · {row.tahun_terbit}
                    </small>
                  </span>

                  <span className={`kt-status ${row.cover ? 'ok' : 'warn'}`}>
                    {row.cover ? '✅ Sampul lengkap' : '⚠️ Belum ada sampul'}
                  </span>

                  <Link to={`/buku/${row.id}/edit`} className="btn btn-sm btn-primary">
                    {row.cover ? 'Edit' : 'Lengkapi'}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --------- Kontrol per kategori --------- */}
        <aside className="kp-side">
          <section className="panel">
            <div className="panel-head">
              <h2>Kontrol per Kategori</h2>
            </div>

            <ul className="kp-bars">
              {perKategori.map((k, i) => {
                const pct = Math.round((k.lengkap / k.total) * 100)
                return (
                  <li key={k.name}>
                    <span className="kp-bar-top">
                      <span>{k.name}</span>
                      <b>
                        {k.lengkap}/{k.total}
                      </b>
                    </span>
                    <span className="kp-bar-rail">
                      <i
                        className={pct === 100 ? 'is-full' : ''}
                        style={{
                          width: `${Math.max(pct, 6)}%`,
                          animationDelay: `${i * 0.07}s`,
                        }}
                      />
                    </span>
                  </li>
                )
              })}
            </ul>

            <Link to="/laporan" className="btn btn-ghost btn-block kt-report">
              📊 Buka Laporan Buku
            </Link>
          </section>
        </aside>
      </div>
    </div>
  )
}
