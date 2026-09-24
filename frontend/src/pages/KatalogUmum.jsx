import { useEffect, useMemo, useState } from 'react'
import { api, apiBase } from '../api/client'
import Cover from '../components/Cover'
import { initials } from '../config/site'
import './KatalogMenu.css'

/**
 * Katalog Pustakawan Umum — tampilan katalog publik (hanya baca),
 * tanpa tombol aksi CRUD.
 */
export default function KatalogUmum() {
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
        [b.judul, b.penulis, b.penerbit, b.kode_buku].some((v) =>
          String(v).toLowerCase().includes(keyword),
        )
      const cocokKat = !kategori || b.kategori === kategori
      return cocokQ && cocokKat
    })
  }, [buku, q, kategori])

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Katalog Pustakawan Umum</h1>
          <p>Jelajahi seluruh koleksi perpustakaan — tampilan katalog publik</p>
        </div>
        <span className="panel-chip">{buku.length} judul tersedia</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* --------- Bar pencarian + filter kategori --------- */}
      <section className="panel ku-hero">
        <span className="ku-hero-ico" aria-hidden="true">
          📖
        </span>

        <div className="ku-hero-body">
          <div className="ku-search">
            <span className="search-ico" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              placeholder="Cari judul, penulis, penerbit..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Cari katalog"
            />
          </div>

          <div className="ku-chips">
            <button
              type="button"
              className={`ku-chip${kategori === '' ? ' is-on' : ''}`}
              onClick={() => setKategori('')}
            >
              Semua
            </button>
            {kategoriList.map((k) => (
              <button
                type="button"
                key={k}
                className={`ku-chip${kategori === k ? ' is-on' : ''}`}
                onClick={() => setKategori(k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --------- Grid katalog --------- */}
      {loading ? (
        <div className="loading">Memuat katalog...</div>
      ) : rows.length === 0 ? (
        <section className="panel">
          <p className="center empty">Tidak ada buku yang cocok dengan pencarian Anda.</p>
        </section>
      ) : (
        <div className="ku-grid">
          {rows.map((row) => (
            <article className="ku-card" key={row.id}>
              <div className="ku-cover">
                <Cover
                  kategori={row.kategori}
                  size="lg"
                  src={row.cover ? `${apiBase}/buku/${row.id}/cover` : ''}
                />
                <span className="ku-kat">{row.kategori}</span>
              </div>

              <div className="ku-body">
                <h3 className="ku-title" title={row.judul}>
                  {row.judul}
                </h3>

                <p className="ku-author">
                  <span className="avatar xs">{initials(row.penulis)}</span>
                  {row.penulis}
                </p>

                <dl className="ku-meta">
                  <div>
                    <dt>Kode</dt>
                    <dd>{row.kode_buku}</dd>
                  </div>
                  <div>
                    <dt>Tahun</dt>
                    <dd>{row.tahun_terbit}</dd>
                  </div>
                </dl>

                <p className="ku-penerbit">🏢 {row.penerbit}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="ku-foot">
        📡 Katalog ini menampilkan data langsung dari <code>GET /api/buku</code> — perubahan data
        oleh admin akan langsung terlihat di sini.
      </p>
    </div>
  )
}
