import { useEffect, useMemo, useState } from 'react'
import { api, downloadFile } from '../api/client'
import './Katalog.css'

/**
 * Halaman Laporan Buku: rekapitulasi koleksi + unduh Excel / PDF.
 */
export default function Laporan() {
  const [stats, setStats] = useState(null)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [exporting, setExporting] = useState('')

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const [statRes, bookRes] = await Promise.all([api('/statistik'), api('/buku')])
        if (!active) return
        setStats(statRes.data)
        setBooks(bookRes.data)
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

  // Pesan sukses hilang sendiri
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  const penerbitRows = useMemo(() => {
    const map = new Map()

    for (const b of books) {
      if (!map.has(b.penerbit)) {
        map.set(b.penerbit, { penerbit: b.penerbit, jumlah: 0, kategori: new Set() })
      }
      const item = map.get(b.penerbit)
      item.jumlah += 1
      item.kategori.add(b.kategori)
    }

    return [...map.values()]
      .map((r) => ({ ...r, kategori: [...r.kategori].join(', ') }))
      .sort((a, b) => b.jumlah - a.jumlah || a.penerbit.localeCompare(b.penerbit))
  }, [books])

  const tahunRange = stats?.buku_per_tahun?.length
    ? `${stats.buku_per_tahun[0].tahun_terbit}–${
        stats.buku_per_tahun[stats.buku_per_tahun.length - 1].tahun_terbit
      }`
    : '-'

  const handleExport = async (type) => {
    setExporting(type)
    setError('')
    try {
      if (type === 'excel') {
        await downloadFile('/export/excel', 'data_buku.xls')
        setNotice('Laporan Excel berhasil diunduh.')
      } else {
        await downloadFile('/export/pdf', 'data_buku.pdf')
        setNotice('Laporan PDF berhasil diunduh.')
      }
    } catch (err) {
      setError(err.message)
      window.setTimeout(() => setError(''), 4000)
    } finally {
      setExporting('')
    }
  }

  if (loading) return <div className="loading">Menyusun laporan...</div>

  const maxKategori = Math.max(...(stats?.buku_per_kategori ?? []).map((k) => k.jumlah), 1)
  const maxTahun = Math.max(...(stats?.buku_per_tahun ?? []).map((t) => t.jumlah), 1)
  const maxPenerbit = Math.max(...penerbitRows.map((p) => p.jumlah), 1)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Laporan Buku</h1>
          <p>Rekapitulasi koleksi perpustakaan dan unduh laporan resmi</p>
        </div>

        <div className="toolbar">
          <button
            type="button"
            className="btn btn-success"
            onClick={() => handleExport('excel')}
            disabled={exporting !== ''}
          >
            {exporting === 'excel' ? 'Mengunduh...' : '⬇ Unduh Excel'}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => handleExport('pdf')}
            disabled={exporting !== ''}
          >
            {exporting === 'pdf' ? 'Mengunduh...' : '⬇ Unduh PDF'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      {/* Ringkasan */}
      <div className="stat-grid">
        <div className="stat-card tone-blue">
          <span className="stat-ico">📚</span>
          <div className="stat-body">
            <strong className="stat-value">{stats.total_buku}</strong>
            <span className="stat-label">Total Buku</span>
          </div>
        </div>
        <div className="stat-card tone-green">
          <span className="stat-ico">🏷️</span>
          <div className="stat-body">
            <strong className="stat-value">{stats.total_kategori}</strong>
            <span className="stat-label">Kategori</span>
          </div>
        </div>
        <div className="stat-card tone-purple">
          <span className="stat-ico">✍️</span>
          <div className="stat-body">
            <strong className="stat-value">{stats.total_penulis}</strong>
            <span className="stat-label">Penulis</span>
          </div>
        </div>
        <div className="stat-card tone-orange">
          <span className="stat-ico">🏢</span>
          <div className="stat-body">
            <strong className="stat-value">{penerbitRows.length}</strong>
            <span className="stat-label">Penerbit</span>
          </div>
        </div>
        <div className="stat-card tone-red">
          <span className="stat-ico">📅</span>
          <div className="stat-body">
            <strong className="stat-value" style={{ fontSize: 20 }}>
              {tahunRange}
            </strong>
            <span className="stat-label">Rentang Terbit</span>
          </div>
        </div>
      </div>

      <div className="rp-grid">
        {/* Per kategori */}
        <section className="panel">
          <div className="panel-head">
            <h2>Rekap per Kategori</h2>
            <span className="panel-chip">{stats.total_kategori} baris</span>
          </div>

          <div className="table-wrap">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>KATEGORI</th>
                  <th className="right">JUMLAH</th>
                  <th className="center">PERSENTASE</th>
                  <th>SEBARAN</th>
                </tr>
              </thead>
              <tbody>
                {stats.buku_per_kategori.map((row) => (
                  <tr key={row.kategori}>
                    <td>{row.kategori}</td>
                    <td className="right">{row.jumlah}</td>
                    <td className="center">{Math.round((row.jumlah / stats.total_buku) * 100)}%</td>
                    <td>
                      <div className="bar-rail">
                        <span
                          className="bar-fill"
                          style={{ width: `${Math.max((row.jumlah / maxKategori) * 100, 6)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Per tahun */}
        <section className="panel">
          <div className="panel-head">
            <h2>Rekap per Tahun Terbit</h2>
            <span className="panel-chip">{tahunRange}</span>
          </div>

          <div className="table-wrap">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th className="center">TAHUN</th>
                  <th className="right">JUMLAH</th>
                  <th className="center">PERSENTASE</th>
                  <th>SEBARAN</th>
                </tr>
              </thead>
              <tbody>
                {stats.buku_per_tahun.map((row) => (
                  <tr key={row.tahun_terbit}>
                    <td className="center">{row.tahun_terbit}</td>
                    <td className="right">{row.jumlah}</td>
                    <td className="center">
                      {Math.round((row.jumlah / stats.total_buku) * 100)}%
                    </td>
                    <td>
                      <div className="bar-rail">
                        <span
                          className="bar-fill alt"
                          style={{ width: `${Math.max((row.jumlah / maxTahun) * 100, 6)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Per penerbit */}
        <section className="panel rp-full">
          <div className="panel-head">
            <h2>Rekap per Penerbit</h2>
            <span className="panel-chip">{penerbitRows.length} penerbit</span>
          </div>

          <div className="table-wrap">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>PENERBIT</th>
                  <th>KATEGORI</th>
                  <th className="right">JUMLAH BUKU</th>
                  <th>SEBARAN</th>
                </tr>
              </thead>
              <tbody>
                {penerbitRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="center empty">
                      Belum ada data buku.
                    </td>
                  </tr>
                ) : (
                  penerbitRows.map((row) => (
                    <tr key={row.penerbit}>
                      <td>{row.penerbit}</td>
                      <td>
                        <span className="chip">{row.kategori}</span>
                      </td>
                      <td className="right">{row.jumlah}</td>
                      <td>
                        <div className="bar-rail">
                          <span
                            className="bar-fill alt2"
                            style={{ width: `${Math.max((row.jumlah / maxPenerbit) * 100, 6)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
