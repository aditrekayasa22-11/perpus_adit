import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiBase } from '../api/client'
import Cover from '../components/Cover'
import { initials } from '../config/site'
import './Dashboard.css'

/* ---------------- Kartu statistik ---------------- */
const STAT_META = [
  { key: 'total_buku', label: 'Total Buku', icon: '📚', tone: 'red' },
  { key: 'total_kategori', label: 'Kategori', icon: '🏷️', tone: 'blue' },
  { key: 'total_penerbit', label: 'Penerbit', icon: '🏢', tone: 'orange' },
  { key: 'tahun_terbit', label: 'Tahun Terbit', icon: '📅', tone: 'green' },
]

const DONUT_COLORS = ['#ef4444', '#2563eb', '#f59e0b', '#7c3aed', '#16a34a', '#0d9488', '#64748b']

/** Buat path halus (Catmull-Rom → kubik bezier) dari titik-titik. */
function smoothPath(pts) {
  if (!pts.length) return ''
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`

  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(
      1,
    )} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`
  }
  return d
}

/**
 * Grafik garis "Trend Koleksi": jumlah buku per tahun (solid)
 * dan kumulatif (putus-putus) — seperti referensi tampilan.
 */
function TrendChart({ rows }) {
  const plotRef = useRef(null)
  const [box, setBox] = useState({ w: 660, h: 300 })

  // Ukur kotak grafik yang sebenarnya (bukan rasio tetap) supaya SVG
  // mengisi penuh lebar DAN tinggi panel, serta menyesuaikan saat
  // jendela diubah ukurannya / layar berpindah ke HP.
  useLayoutEffect(() => {
    const el = plotRef.current
    if (!el) return undefined

    const measure = () => {
      const w = Math.round(el.clientWidth)
      const h = Math.round(el.clientHeight)
      if (w > 0 && h > 0) {
        setBox((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
      }
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!rows.length) return <p className="chart-note">Belum ada data tahun terbit.</p>

  // 1 unit viewBox = 1 px sehingga garis & teks tetap tajam (tidak di-scale).
  const W = Math.max(box.w, 260)
  const H = Math.max(box.h, 200)
  const padL = 46
  const padR = 18
  const padT = 34
  const padB = 34
  const n = rows.length

  const yearly = rows.map((r) => Number(r.jumlah))
  // Nilai kumulatif tanpa mutasi: jumlahkan semua baris sebelum indeks i.
  const cumul = yearly.map((_, i) => yearly.slice(0, i + 1).reduce((a, b) => a + b, 0))

  const maxA = Math.max(...yearly, 1)
  const maxB = Math.max(...cumul, 1)

  // Tick sumbu-Y bilangan bulat (hindari label kembar seperti 2,1,1,0)
  const step = Math.max(1, Math.ceil(maxA / 3))
  const ticks = []
  for (let v = 0; v <= maxA; v += step) ticks.push(v)
  if (maxA - ticks[ticks.length - 1] > step / 2) ticks.push(maxA)

  const xOf = (i) => padL + (i * (W - padL - padR)) / (n - 1 || 1)
  const yOf = (v, max) => padT + (1 - v / max) * (H - padT - padB)

  const ptsA = yearly.map((v, i) => ({ x: xOf(i), y: yOf(v, maxA), v, tahun: rows[i].tahun_terbit }))
  const ptsB = cumul.map((v, i) => ({ x: xOf(i), y: yOf(v, maxB), v }))

  const lineA = smoothPath(ptsA)
  const lineB = smoothPath(ptsB)
  const baseline = H - padB
  const areaA = `${lineA} L${ptsA[n - 1].x.toFixed(1)},${baseline} L${ptsA[0].x.toFixed(
    1,
  )},${baseline} Z`
  const peak = ptsA.reduce((a, b) => (b.v > a.v ? b : a), ptsA[0])

  // Sebaran label tahun mengikuti lebar kotak: makin sempit, makin jarang.
  const labelEvery = Math.max(
    1,
    Math.ceil((n * 32) / Math.max(W - padL - padR, 1)),
  )
  const last = n - 1
  const prevMultiple = Math.floor(last / labelEvery) * labelEvery
  const showLast = last - prevMultiple >= Math.ceil(labelEvery / 2)
  const showLabel = (i) =>
    i % labelEvery === 0 || (i === last && showLast) || n <= 6

  return (
    <div className="tr-wrap">
      <div className="tr-legend">
        <span className="tr-key">
          <i className="tr-dot accent" /> Buku Terbit
        </span>
        <span className="tr-key">
          <i className="tr-dot blue" /> Kumulatif
        </span>
      </div>

      <div className="tr-plot" ref={plotRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="tr-svg"
          role="img"
          aria-label="Grafik tren koleksi buku per tahun terbit"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {ticks.map((v) => {
            const y = yOf(v, maxA)
            return (
              <g key={v}>
                <line x1={padL} x2={W - padR} y1={y} y2={y} className="tr-grid" />
                <text x={padL - 9} y={y + 3.5} className="tr-y" textAnchor="end">
                  {v}
                </text>
              </g>
            )
          })}

          <path d={areaA} fill="url(#trFill)" className="tr-area" />
          <path d={lineB} className="tr-line tr-line-b" pathLength="1" />
          <path d={lineA} className="tr-line tr-line-a" pathLength="1" />

          {ptsA.map((p) => (
            <circle key={p.tahun} cx={p.x} cy={p.y} r="4" className="tr-dot-a">
              <title>{`${p.tahun}: ${p.v} buku`}</title>
            </circle>
          ))}

          <circle cx={peak.x} cy={peak.y} r="6" className="tr-peak" />
          <g
            className="tr-tip"
            transform={`translate(${Math.min(Math.max(peak.x - 34, 2), W - 72)}, ${Math.max(
              peak.y - 36,
              2,
            )})`}
          >
            <rect width="68" height="24" rx="7" />
            <text x="34" y="16" textAnchor="middle">
              {peak.v} buku
            </text>
          </g>

          {ptsA.map((p, i) =>
            showLabel(i) ? (
              <text key={p.tahun} x={p.x} y={H - 10} className="tr-x" textAnchor="middle">
                {p.tahun}
              </text>
            ) : null,
          )}
        </svg>
      </div>
    </div>
  )
}

/** Donut kategori. */
function DonutChart({ rows, total }) {
  const top = rows.slice(0, 6)
  const rest = rows.slice(6)
  const slices = rest.length
    ? [...top, { kategori: 'Lainnya', jumlah: rest.reduce((s, r) => s + r.jumlah, 0) }]
    : top

  const C = 2 * Math.PI * 58

  // Panjang & offset tiap irisan dihitung tanpa mutasi (aman untuk render ulang).
  const lens = slices.map((s) => (s.jumlah / total) * C)
  const offsets = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0))

  return (
    <div className="dn-wrap">
      <div className="dn-ring">
        <svg viewBox="0 0 150 150" role="img" aria-label="Sebaran kategori buku">
          <circle cx="75" cy="75" r="58" className="dn-track" />
          {slices.map((s, i) => {
            const len = lens[i]
            return (
              <circle
                key={s.kategori}
                cx="75"
                cy="75"
                r="58"
                fill="none"
                stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth="17"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offsets[i]}
                className="dn-slice"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <title>{`${s.kategori}: ${s.jumlah} buku`}</title>
              </circle>
            )
          })}
          <text x="75" y="70" className="dn-num" textAnchor="middle">
            {total}
          </text>
          <text x="75" y="88" className="dn-cap" textAnchor="middle">
            Buku
          </text>
        </svg>
      </div>

      <ul className="dn-legend">
        {slices.map((s, i) => (
          <li key={s.kategori}>
            <i style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span>{s.kategori}</span>
            <b>{s.jumlah}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Dashboard Admin: kartu statistik, tren koleksi, dan koleksi terbaru.
 */
export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [books, setBooks] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        const [statRes, bookRes] = await Promise.all([api('/statistik'), api('/buku')])
        if (!active) return
        setStats(statRes.data)
        setBooks(bookRes.data)
        setError('')
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

  if (loading) return <div className="loading">Memuat statistik...</div>
  if (error) return <div className="alert alert-error">{error}</div>
  if (!stats) return null

  const penerbitList = [...new Set(books.map((b) => b.penerbit))]
  const years = stats.buku_per_tahun
  const katRows = [...stats.buku_per_kategori].sort((a, b) => b.jumlah - a.jumlah)
  const topPenerbit = [...stats.buku_per_penerbit][0]

  const values = {
    total_buku: stats.total_buku,
    total_kategori: stats.total_kategori,
    total_penerbit: penerbitList.length,
    tahun_terbit: years.length,
  }

  const subs = {
    total_buku: '100% koleksi terdata',
    total_kategori: `rata-rata ${(stats.total_buku / Math.max(stats.total_kategori, 1)).toFixed(
      1,
    )} buku/kategori`,
    total_penerbit: topPenerbit ? `terbanyak: ${topPenerbit.penerbit}` : 'belum ada data',
    tahun_terbit: years.length
      ? `${years[0].tahun_terbit}–${years[years.length - 1].tahun_terbit}`
      : '-',
  }

  const recent = books.slice(0, 8)
  const maxKat = Math.max(...katRows.map((k) => k.jumlah), 1)

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Ringkasan koleksi, tren, dan data buku terbaru perpustakaan</p>
        </div>
        <span className="panel-chip">Kategori terbanyak: {stats.kategori_terbanyak}</span>
      </div>

      {/* --------- Kartu statistik --------- */}
      <div className="stat-grid">
        {STAT_META.map((meta, i) => (
          <div
            className={`stat-card tone-${meta.tone}`}
            key={meta.key}
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className="stat-ico">{meta.icon}</span>
            <div className="stat-body">
              <strong className="stat-value">{values[meta.key]}</strong>
              <span className="stat-label">{meta.label}</span>
              <small className="stat-sub">{subs[meta.key]}</small>
            </div>
          </div>
        ))}
      </div>

      {/* --------- Grafik + kolom kanan --------- */}
      <div className="dash-charts">
        <section className="panel tr-panel">
          <div className="panel-head">
            <h2>Trend Koleksi Buku</h2>
            <span className="panel-chip">Per tahun terbit</span>
          </div>
          <TrendChart rows={years} />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Paling Populer</h2>
            <span className="panel-chip">Per kategori</span>
          </div>

          <ul className="pop-list">
            {katRows.map((row, i) => (
              <li key={row.kategori}>
                <span className="pop-top">
                  <span>
                    <i className={`pop-rank rank-${i}`}>{i + 1}</i>
                    {row.kategori}
                  </span>
                  <b>{row.jumlah}</b>
                </span>
                <span className="pop-rail">
                  <i
                    className={`pop-fill rank-${i}`}
                    style={{
                      width: `${Math.max((row.jumlah / maxKat) * 100, 8)}%`,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Kategori Terbanyak</h2>
            <span className="panel-chip">{stats.total_kategori} kategori</span>
          </div>
          <DonutChart rows={katRows} total={stats.total_buku} />
        </section>
      </div>

      {/* --------- Tabel koleksi terbaru --------- */}
      <section className="panel">
        <div className="panel-head">
          <h2>Koleksi Buku Terbaru</h2>
          <Link className="btn btn-sm btn-ghost" to="/buku">
            Lihat semua →
          </Link>
        </div>

        <div className="table-wrap">
          <table className="table table-striped">
            <thead>
              <tr>
                <th className="center">NO</th>
                <th>KODE BUKU</th>
                <th>JUDUL</th>
                <th>PENULIS</th>
                <th>KATEGORI</th>
                <th className="center">TAHUN</th>
                <th>PENERBIT</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="center empty">
                    Belum ada data buku.
                  </td>
                </tr>
              ) : (
                recent.map((row, i) => (
                  <tr key={row.id}>
                    <td className="center">{i + 1}</td>
                    <td>
                      <span className="badge">{row.kode_buku}</span>
                    </td>
                    <td>
                      <div className="cell-book">
                        <Cover
                          kategori={row.kategori}
                          size="sm"
                          src={row.cover ? `${apiBase}/buku/${row.id}/cover` : ''}
                        />
                        <span className="cell-book-text">
                          <strong>{row.judul}</strong>
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="person">
                        <span className="avatar xs">{initials(row.penulis)}</span>
                        {row.penulis}
                      </span>
                    </td>
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
      </section>
    </div>
  )
}
