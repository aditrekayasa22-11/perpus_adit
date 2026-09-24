import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import './Katalog.css'

const META = {
  Novel: { icon: '📕', tone: 'rose' },
  Teknologi: { icon: '💻', tone: 'blue' },
  Sejarah: { icon: '🏛️', tone: 'amber' },
  Filsafat: { icon: '🧠', tone: 'violet' },
  Pendidikan: { icon: '🎓', tone: 'green' },
  'Pengembangan Diri': { icon: '🌱', tone: 'teal' },
}

const metaOf = (kategori) => META[kategori] || { icon: '📘', tone: 'slate' }

/**
 * Halaman Kategori Buku: ringkasan koleksi per kategori.
 */
export default function KategoriBuku() {
  const [buku, setBuku] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const rows = useMemo(() => {
    const map = new Map()

    for (const b of buku) {
      if (!map.has(b.kategori)) {
        map.set(b.kategori, {
          kategori: b.kategori,
          jumlah: 0,
          penulis: new Set(),
          penerbit: new Set(),
          tahun: [],
        })
      }
      const item = map.get(b.kategori)
      item.jumlah += 1
      item.penulis.add(b.penulis)
      item.penerbit.add(b.penerbit)
      item.tahun.push(b.tahun_terbit)
    }

    return [...map.values()]
      .map((i) => ({
        kategori: i.kategori,
        jumlah: i.jumlah,
        penulis: i.penulis.size,
        penerbit: i.penerbit.size,
        tahunMin: Math.min(...i.tahun),
        tahunMax: Math.max(...i.tahun),
        contoh: buku.find((b) => b.kategori === i.kategori)?.judul ?? '',
      }))
      .sort((a, b) => b.jumlah - a.jumlah || a.kategori.localeCompare(b.kategori))
  }, [buku])

  const total = buku.length
  const max = Math.max(...rows.map((r) => r.jumlah), 1)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Kategori Buku</h1>
          <p>Kelompokkan koleksi perpustakaan berdasarkan kategori</p>
        </div>
        <span className="panel-chip">
          {rows.length} kategori · {total} buku
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Memuat data kategori...</div>
      ) : rows.length === 0 ? (
        <section className="panel">
          <p className="center empty">Belum ada data buku.</p>
        </section>
      ) : (
        <div className="kat-grid">
          {rows.map((row, i) => {
            const meta = metaOf(row.kategori)
            const persen = Math.round((row.jumlah / total) * 100)

            return (
              <article className={`kat-card tone-${meta.tone}`} key={row.kategori}>
                <div className="kat-top">
                  <span className="kat-ico">{meta.icon}</span>
                  <div className="kat-head">
                    <h2>{row.kategori}</h2>
                    <span className="kat-share">{persen}% dari koleksi</span>
                  </div>
                </div>

                <div className="kat-count">
                  <strong>{row.jumlah}</strong>
                  <span>buku</span>
                </div>

                <div className="bar-rail" aria-hidden="true">
                  <span
                    className="bar-fill"
                    style={{ width: `${Math.max((row.jumlah / max) * 100, 8)}%`, animationDelay: `${i * 0.06}s` }}
                  />
                </div>

                <dl className="kat-meta">
                  <div>
                    <dt>Penulis</dt>
                    <dd>{row.penulis}</dd>
                  </div>
                  <div>
                    <dt>Penerbit</dt>
                    <dd>{row.penerbit}</dd>
                  </div>
                  <div>
                    <dt>Tahun</dt>
                    <dd>
                      {row.tahunMin}
                      {row.tahunMax !== row.tahunMin ? `–${row.tahunMax}` : ''}
                    </dd>
                  </div>
                </dl>

                <p className="kat-contoh" title={row.contoh}>
                  Contoh: <strong>{row.contoh}</strong>
                </p>

                <div className="kat-foot">
                  <Link className="btn btn-sm btn-ghost" to={`/buku?kategori=${encodeURIComponent(row.kategori)}`}>
                    Lihat buku →
                  </Link>
                  <Link className="btn btn-sm btn-primary" to="/buku/tambah">
                    + Tambah
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
