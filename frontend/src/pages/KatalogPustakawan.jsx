import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import './KatalogMenu.css'

/**
 * Katalog Pustakawan — daftar katalog resmi dalam bentuk tabel
 * plus panel ringkasan untuk kebutuhan pustakawan.
 */
export default function KatalogPustakawan() {
  const [buku, setBuku] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [kategori, setKategori] = useState('')

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

  const kategoriList = useMemo(
    () => [...new Set(buku.map((b) => b.kategori))].sort(),
    [buku],
  )

  const rows = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    return buku.filter((b) => {
      const cocokQ =
        !keyword ||
        [b.kode_buku, b.judul, b.penulis, b.penerbit].some((v) =>
          String(v).toLowerCase().includes(keyword),
        )
      const cocokKat = !kategori || b.kategori === kategori
      return cocokQ && cocokKat
    })
  }, [buku, q, kategori])

  const perKategori = useMemo(() => {
    const map = new Map()
    for (const b of buku) map.set(b.kategori, (map.get(b.kategori) || 0) + 1)
    return [...map.entries()]
      .map(([name, jumlah]) => ({ name, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
  }, [buku])

  const penerbitList = useMemo(() => new Set(buku.map((b) => b.penerbit)), [buku])
  const tahunList = useMemo(
    () => [...new Set(buku.map((b) => b.tahun_terbit))].sort((a, b) => b - a),
    [buku],
  )
  const maxKat = Math.max(...perKategori.map((k) => k.jumlah), 1)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Katalog Pustakawan</h1>
          <p>Daftar katalog resmi koleksi untuk kebutuhan pustakawan sekolah</p>
        </div>
        <div className="toolbar">
          <Link to="/buku" className="btn btn-dark">
            📚 Kelola Data Buku
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="kp-layout">
        {/* ---------- Tabel katalog ---------- */}
        <section className="panel">
          <div className="panel-head">
            <h2>Katalog Koleksi</h2>
            <span className="panel-chip">
              {rows.length} dari {buku.length} judul
            </span>
          </div>

          <div className="kp-filters">
            <input
              type="search"
              className="input-search kp-q"
              placeholder="Cari judul, kode, penulis, penerbit..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari katalog"
            />
            <select
              className="input-select"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              aria-label="Filter kategori"
            >
              <option value="">Semua kategori</option>
              {kategoriList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading">Memuat katalog...</div>
          ) : (
            <div className="table-wrap">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th className="center">NO</th>
                    <th>KODE</th>
                    <th>JUDUL</th>
                    <th>PENULIS</th>
                    <th>KATEGORI</th>
                    <th className="center">TAHUN</th>
                    <th>PENERBIT</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="center empty">
                        Tidak ada judul yang cocok.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, i) => (
                      <tr key={row.id}>
                        <td className="center">{i + 1}</td>
                        <td>
                          <span className="badge">{row.kode_buku}</span>
                        </td>
                        <td className="kp-judul">{row.judul}</td>
                        <td>{row.penulis}</td>
                        <td>
                          <span className="chip">{row.kategori}</span>
                        </td>
                        <td className="center">{row.tahun_terbit}</td>
                        <td>{row.penerbit}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ---------- Ringkasan ---------- */}
        <aside className="kp-side">
          <section className="panel">
            <div className="panel-head">
              <h2>Ringkasan Katalog</h2>
            </div>

            <ul className="kp-sum">
              <li>
                <span>Total judul</span>
                <b>{buku.length}</b>
              </li>
              <li>
                <span>Kategori</span>
                <b>{kategoriList.length}</b>
              </li>
              <li>
                <span>Penerbit</span>
                <b>{penerbitList.size}</b>
              </li>
              <li>
                <span>Rentang tahun</span>
                <b>{tahunList.length ? `${tahunList[0]}–${tahunList[tahunList.length - 1]}` : '-'}</b>
              </li>
            </ul>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Katalog per Kategori</h2>
            </div>

            <ul className="kp-bars">
              {perKategori.map((k, i) => (
                <li key={k.name}>
                  <span className="kp-bar-top">
                    <span>{k.name}</span>
                    <b>{k.jumlah}</b>
                  </span>
                  <span className="kp-bar-rail">
                    <i
                      style={{
                        width: `${Math.max((k.jumlah / maxKat) * 100, 8)}%`,
                        animationDelay: `${i * 0.07}s`,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
