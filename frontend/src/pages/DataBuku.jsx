import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { api, apiBase, downloadFile } from '../api/client'
import Cover from '../components/Cover'
import { initials } from '../config/site'
import { useAuth } from '../context/AuthContext'
import './DataBuku.css'

const PER_PAGE = 9

/**
 * Halaman Data Buku: kartu katalog, pencarian, filter kategori.
 *
 * Perilaku menyesuaikan role user:
 * - admin   : Tambah / Edit / Hapus + export Excel & PDF
 * - petugas : hanya melihat daftar buku
 * - siswa   : melihat daftar buku + tombol "Pinjam" untuk mengajukan
 *             peminjaman (POST /peminjaman)
 *
 * Tambah & Edit dilakukan di halaman khusus (/buku/tambah dan
 * /buku/{id}/edit); pesan sukses dikirim lewat router state.
 */
export default function DataBuku() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const role = user?.role || 'admin'
  const canManage = role === 'admin'
  const isSiswa = role === 'siswa'

  const [buku, setBuku] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => searchParams.get('q') || '')
  const [kategoriFilter, setKategoriFilter] = useState(
    () => searchParams.get('kategori') || '',
  )
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(() => location.state?.notice || '')

  const [exporting, setExporting] = useState('')
  const [pinjamId, setPinjamId] = useState(0)

  const flash = (message) => setNotice(message)

  const loadBuku = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const res = await api('/buku', { query: q ? { q } : undefined })
      setBuku(res.data)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Pesan sukses (dari halaman tambah/edit atau hasil export) hilang sendiri
  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  // Pencarian dengan debounce (juga menjadi pemuat awal saat mount)
  useEffect(() => {
    const timer = window.setTimeout(() => loadBuku(search), 350)
    return () => window.clearTimeout(timer)
  }, [search, loadBuku])

  const handleSearchChange = (value) => {
    setSearch(value)
    setPage(1)
  }

  const handleKategoriChange = (value) => {
    setKategoriFilter(value)
    setPage(1)
  }

  // Daftar kategori untuk filter (diturunkan dari data yang sudah dimuat)
  const kategoriList = useMemo(
    () => [...new Set(buku.map((b) => b.kategori))].sort(),
    [buku],
  )

  const penulisList = useMemo(() => new Set(buku.map((b) => b.penulis)), [buku])

  const tahunList = useMemo(
    () => [...new Set(buku.map((b) => b.tahun_terbit))].sort((a, b) => b - a),
    [buku],
  )

  const rows = useMemo(
    () => (kategoriFilter ? buku.filter((b) => b.kategori === kategoriFilter) : buku),
    [buku, kategoriFilter],
  )

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const current = Math.min(page, pages)
  const slice = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE)

  // ---------- Hapus ----------
  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus buku "${row.judul}" (${row.kode_buku})?`)) return

    try {
      const res = await api(`/buku/${row.id}`, { method: 'DELETE' })
      flash(res.message)
      await loadBuku(search)
    } catch (err) {
      setError(err.message)
      window.setTimeout(() => setError(''), 3000)
    }
  }

  // ---------- Export (admin saja) ----------
  const handleExport = async (type) => {
    setExporting(type)
    setError('')
    try {
      if (type === 'excel') {
        await downloadFile('/export/excel', 'data_buku.xls')
        flash('File Excel berhasil diunduh.')
      } else {
        await downloadFile('/export/pdf', 'data_buku.pdf')
        flash('File PDF berhasil diunduh.')
      }
    } catch (err) {
      setError(err.message)
      window.setTimeout(() => setError(''), 4000)
    } finally {
      setExporting('')
    }
  }

  // ---------- Pinjam (siswa) ----------
  const handlePinjam = async (row) => {
    if (
      !window.confirm(
        `Ajukan peminjaman buku "${row.judul}" (${row.kode_buku})?\n\n` +
          'Pengajuan akan diproses oleh petugas perpustakaan.',
      )
    ) {
      return
    }

    setPinjamId(row.id)
    setError('')
    try {
      const res = await api('/peminjaman', {
        method: 'POST',
        body: { buku_id: row.id },
      })
      flash(res.message || 'Pengajuan peminjaman terkirim — menunggu proses petugas.')
    } catch (err) {
      setError(err.message)
      window.setTimeout(() => setError(''), 4000)
    } finally {
      setPinjamId(0)
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{canManage ? 'Data Buku' : 'Daftar Buku'}</h1>
          <p>
            {canManage
              ? 'Kelola data buku perpustakaan — tambah, edit, hapus, dan cetak laporan'
              : isSiswa
                ? 'Telusuri koleksi buku dan ajukan peminjaman favoritmu'
                : 'Daftar koleksi buku perpustakaan (lihat saja)'}
          </p>
        </div>

        <div className="toolbar">
          {canManage ? (
            <>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => handleExport('excel')}
                disabled={exporting !== ''}
              >
                {exporting === 'excel' ? 'Mengunduh...' : '⬇ Excel'}
              </button>

              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleExport('pdf')}
                disabled={exporting !== ''}
              >
                {exporting === 'pdf' ? 'Mengunduh...' : '⬇ PDF'}
              </button>

              <Link to="/buku/tambah" className="btn btn-accent">
                + Tambah Buku
              </Link>
            </>
          ) : (
            <span className="bk-role-note">
              {isSiswa ? '🎓 Mode Siswa — klik "Pinjam" untuk mengajukan' : '🧑‍🏫 Mode Petugas'}
            </span>
          )}
        </div>
      </div>

      {/* Ringkasan kecil */}
      <div className="stat-grid">
        <div className="stat-card tone-red">
          <span className="stat-ico">📚</span>
          <div className="stat-body">
            <strong className="stat-value">{buku.length}</strong>
            <span className="stat-label">Total Buku</span>
            <small className="stat-sub">judul terdata</small>
          </div>
        </div>
        <div className="stat-card tone-blue">
          <span className="stat-ico">🏷️</span>
          <div className="stat-body">
            <strong className="stat-value">{kategoriList.length}</strong>
            <span className="stat-label">Kategori Unik</span>
            <small className="stat-sub">kelompok koleksi</small>
          </div>
        </div>
        <div className="stat-card tone-purple">
          <span className="stat-ico">✍️</span>
          <div className="stat-body">
            <strong className="stat-value">{penulisList.size}</strong>
            <span className="stat-label">Penulis Unik</span>
            <small className="stat-sub">pengarang berbeda</small>
          </div>
        </div>
        <div className="stat-card tone-green">
          <span className="stat-ico">📅</span>
          <div className="stat-body">
            <strong className="stat-value" style={{ fontSize: 21 }}>
              {tahunList.length ? `${tahunList[0]}–${tahunList[tahunList.length - 1]}` : '-'}
            </strong>
            <span className="stat-label">Tahun Terbit</span>
            <small className="stat-sub">{tahunList.length} tahun terbit</small>
          </div>
        </div>
      </div>

      {notice && <div className="alert alert-success">{notice}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* --------- Baris filter --------- */}
      <section className="panel bk-filters">
        <span className="input-wrap bk-search">
          <span className="search-ico" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            className="input-search"
            placeholder="Cari judul, kode, penulis..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            aria-label="Cari buku"
          />
        </span>

        <select
          className="input-select"
          value={kategoriFilter}
          onChange={(e) => handleKategoriChange(e.target.value)}
          aria-label="Filter kategori"
        >
          <option value="">Semua kategori</option>
          {kategoriList.map((k) => (
            <option value={k} key={k}>
              {k}
            </option>
          ))}
        </select>

        <span className="bk-count">
          Menampilkan <b>{slice.length}</b> dari <b>{rows.length}</b> buku
          {kategoriFilter ? ` (kategori ${kategoriFilter})` : ''}
        </span>

        {kategoriFilter && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleKategoriChange('')}
          >
            Reset filter
          </button>
        )}
      </section>

      {/* --------- Grid kartu --------- */}
      <section className="panel">
        <div className="panel-head">
          <h2>Daftar Koleksi Buku</h2>
          <span className="panel-chip">
            {search ? `Hasil pencarian "${search}"` : 'Seluruh koleksi'}
          </span>
        </div>

        {loading ? (
          <div className="loading">Memuat data buku...</div>
        ) : slice.length === 0 ? (
          <div className="bk-empty">
            <span className="bk-empty-ico">🔍</span>
            <p>Tidak ada data buku yang cocok.</p>
            {canManage && (
              <Link to="/buku/tambah" className="btn btn-accent btn-sm">
                + Tambah Buku Baru
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="bk-grid">
              {slice.map((row, index) => (
                <article className="bk-card" key={row.id}>
                  <div className="bk-cover">
                    <Cover
                      kategori={row.kategori}
                      size="lg"
                      src={row.cover ? `${apiBase}/buku/${row.id}/cover` : ''}
                    />
                    <span className="bk-kode">{row.kode_buku}</span>
                    <span className="bk-no">
                      {(current - 1) * PER_PAGE + index + 1}
                    </span>
                  </div>

                  <div className="bk-body">
                    <span className="bk-kat">{row.kategori}</span>
                    <h3 className="bk-title" title={row.judul}>
                      {row.judul}
                    </h3>

                    <p className="bk-author">
                      <span className="avatar xs">{initials(row.penulis)}</span>
                      {row.penulis}
                    </p>

                    <dl className="bk-meta">
                      <div>
                        <dt>Tahun</dt>
                        <dd>{row.tahun_terbit}</dd>
                      </div>
                      <div>
                        <dt>Penerbit</dt>
                        <dd title={row.penerbit}>{row.penerbit}</dd>
                      </div>
                    </dl>

                    <div className="bk-actions">
                      {canManage ? (
                        <>
                          <Link to={`/buku/${row.id}/edit`} className="btn btn-sm btn-primary">
                            ✏️ Edit
                          </Link>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(row)}
                          >
                            🗑 Hapus
                          </button>
                        </>
                      ) : isSiswa ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-accent"
                          disabled={pinjamId === row.id}
                          onClick={() => handlePinjam(row)}
                        >
                          {pinjamId === row.id ? 'Mengajukan...' : '📖 Pinjam'}
                        </button>
                      ) : (
                        <span className="bk-view-only">👁️ Hanya lihat</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {pages > 1 && (
              <nav className="bk-page" aria-label="Navigasi halaman">
                <button
                  type="button"
                  className="bk-page-btn"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  ‹ Sebelumnya
                </button>

                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`bk-page-btn${n === current ? ' is-on' : ''}`}
                    onClick={() => setPage(n)}
                    aria-current={n === current ? 'page' : undefined}
                  >
                    {n}
                  </button>
                ))}

                <button
                  type="button"
                  className="bk-page-btn"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  Berikutnya ›
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  )
}
