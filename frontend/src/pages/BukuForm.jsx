import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, apiBase, fileToDataUrl } from '../api/client'
import BookPreview3D from '../components/BookPreview3D'
import './BukuForm.css'

const EMPTY_FORM = {
  kode_buku: '',
  judul: '',
  penulis: '',
  kategori: '',
  tahun_terbit: '',
  penerbit: '',
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_COVER = 3 * 1024 * 1024

/**
 * Halaman tambah / edit data buku.
 *
 * - /buku/tambah      -> form kosong
 * - /buku/{id}/edit   -> form terisi data buku
 */
export default function BukuForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [kategoriList, setKategoriList] = useState([])
  const [customKategori, setCustomKategori] = useState(false)

  // Sampul: `coverDataUrl` = file baru (base64), `currentCover` = file lama
  const [coverDataUrl, setCoverDataUrl] = useState('')
  const [coverFileName, setCoverFileName] = useState('')
  const [coverRemoved, setCoverRemoved] = useState(false)
  const [currentCover, setCurrentCover] = useState('')
  const fileRef = useRef(null)

  // Pencarian di header halaman
  const [headQ, setHeadQ] = useState('')
  const [headKat, setHeadKat] = useState('')

  // Muat data buku (saat mode edit) + daftar kategori
  useEffect(() => {
    let active = true

    ;(async () => {
      if (isEdit) {
        try {
          const res = await api(`/buku/${id}`)
          if (!active) return
          const b = res.data
          setForm({
            kode_buku: b.kode_buku,
            judul: b.judul,
            penulis: b.penulis,
            kategori: b.kategori,
            tahun_terbit: String(b.tahun_terbit),
            penerbit: b.penerbit,
          })
          setCurrentCover(b.cover || '')
        } catch (err) {
          if (active) setError(err.message)
        } finally {
          if (active) setLoading(false)
        }
      }

      try {
        const res = await api('/buku')
        if (!active) return
        setKategoriList([...new Set(res.data.map((b) => b.kategori))].sort())
      } catch {
        /* daftar kategori bersifat pelengkap, diabaikan bila gagal */
      }
    })()

    return () => {
      active = false
    }
  }, [id, isEdit])

  const kategoriOptions = useMemo(() => {
    const set = new Set(kategoriList)
    if (form.kategori) set.add(form.kategori)
    return [...set].sort()
  }, [kategoriList, form.kategori])

  const coverPreview =
    coverDataUrl || (currentCover && !coverRemoved ? `${apiBase}/buku/${id}/cover` : '')

  // Ringkasan otomatis untuk panel pratinjau
  const deskripsi = useMemo(() => {
    const bagian = [
      form.judul ? `"${form.judul}"` : 'Judul buku',
      form.penulis ? `karya ${form.penulis}` : null,
      form.penerbit ? `diterbitkan ${form.penerbit}` : null,
      form.tahun_terbit ? `pada tahun ${form.tahun_terbit}` : null,
    ].filter(Boolean)

    const kalimat = `${bagian.join(' ')}. Kategori ${
      form.kategori || '-'
    }, kode buku ${form.kode_buku || '-'}.`

    return kalimat.length > 220 ? `${kalimat.slice(0, 217)}...` : kalimat
  }, [form])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePickCover = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!IMAGE_TYPES.includes(file.type)) {
      setError('Format sampul harus JPG, PNG, atau WEBP.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_COVER) {
      setError('Ukuran sampul maksimal 3MB.')
      e.target.value = ''
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      setCoverDataUrl(dataUrl)
      setCoverFileName(file.name)
      setCoverRemoved(false)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRemoveCover = () => {
    setCoverDataUrl('')
    setCoverFileName('')
    setCoverRemoved(true)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (headQ.trim()) params.set('q', headQ.trim())
    if (headKat) params.set('kategori', headKat)
    const qs = params.toString()
    navigate(qs ? `/buku?${qs}` : '/buku')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = { ...form, tahun_terbit: Number(form.tahun_terbit) }
    if (coverDataUrl) payload.cover = coverDataUrl
    else if (coverRemoved) payload.cover = ''

    try {
      const res = isEdit
        ? await api(`/buku/${id}`, { method: 'PUT', body: payload })
        : await api('/buku', { method: 'POST', body: payload })

      navigate('/buku', { state: { notice: res.message } })
    } catch (err) {
      const fieldErrors = err.errors ? Object.values(err.errors).flat().join(' ') : ''
      setError([err.message, fieldErrors].filter(Boolean).join(' '))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* ---------------- Header ---------------- */}
      <div className="bf-head">
        <div className="bf-head-text">
          <h1>{isEdit ? 'Edit Data Buku' : 'Tambah Data Buku'}</h1>
          <p>Sistem Manajemen Katalog &amp; Layanan Data Buku Perpustakaan</p>
        </div>

        <form className="head-search" onSubmit={handleSearch} role="search">
          <select
            value={headKat}
            onChange={(e) => setHeadKat(e.target.value)}
            aria-label="Filter kategori"
          >
            <option value="">Semua Kategori</option>
            {kategoriOptions.map((k) => (
              <option value={k} key={k}>
                {k}
              </option>
            ))}
          </select>

          <span className="hs-sep" aria-hidden="true" />

          <span className="hs-field">
            <span className="search-ico" aria-hidden="true">
              🔍
            </span>
            <input
              type="search"
              value={headQ}
              onChange={(e) => setHeadQ(e.target.value)}
              placeholder="Cari judul, penulis, kode buku..."
              aria-label="Cari buku"
            />
          </span>

          <button type="submit" className="btn btn-dark">
            Cari
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading">Memuat data buku...</div>
      ) : (
        <>
          <div className="bf-section">
            <h2>{isEdit ? 'Perbarui Informasi Buku' : 'Tambah Informasi Buku'}</h2>
            <p>
              {isEdit ? (
                <>
                  Mengubah data katalog untuk kode <strong>{form.kode_buku || '-'}</strong>
                </>
              ) : (
                'Melengkapi data katalog buku baru perpustakaan'
              )}
            </p>
          </div>

          <div className="bf-grid">
            {/* ---------------- Form ---------------- */}
            <form className="panel bf-form" onSubmit={handleSubmit}>
              {error && <div className="alert alert-error">{error}</div>}

              <div className="bf-fields">
                <label className="bf-field">
                  <span className="bf-label">
                    KODE BUKU <i>*</i>
                  </span>
                  <input
                    name="kode_buku"
                    value={form.kode_buku}
                    onChange={handleChange}
                    placeholder="BK013"
                    maxLength={10}
                    required
                  />
                </label>

                <label className="bf-field">
                  <span className="bf-label">
                    TAHUN TERBIT <i>*</i>
                  </span>
                  <input
                    name="tahun_terbit"
                    type="number"
                    value={form.tahun_terbit}
                    onChange={handleChange}
                    placeholder="2026"
                    min="1900"
                    max="2100"
                    required
                  />
                </label>

                <label className="bf-field bf-full">
                  <span className="bf-label">
                    JUDUL BUKU LENGKAP <i>*</i>
                  </span>
                  <input
                    name="judul"
                    value={form.judul}
                    onChange={handleChange}
                    placeholder="Judul lengkap buku"
                    maxLength={150}
                    required
                  />
                </label>

                <label className="bf-field">
                  <span className="bf-label">
                    PENULIS / PENGARANG <i>*</i>
                  </span>
                  <input
                    name="penulis"
                    value={form.penulis}
                    onChange={handleChange}
                    placeholder="Nama penulis"
                    maxLength={100}
                    required
                  />
                </label>

                <div className="bf-field">
                  <span className="bf-label bf-label-row">
                    <span>
                      KATEGORI <i>*</i>
                    </span>
                    <button
                      type="button"
                      className="bf-add"
                      onClick={() => setCustomKategori((v) => !v)}
                    >
                      {customKategori ? '▾ Pilih dari daftar' : '+ Tambah Baru'}
                    </button>
                  </span>

                  {customKategori ? (
                    <input
                      name="kategori"
                      value={form.kategori}
                      onChange={handleChange}
                      placeholder="Ketik kategori baru..."
                      maxLength={50}
                      required
                      autoFocus
                    />
                  ) : (
                    <select name="kategori" value={form.kategori} onChange={handleChange} required>
                      <option value="">Pilih kategori</option>
                      {kategoriOptions.map((k) => (
                        <option value={k} key={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <label className="bf-field bf-full">
                  <span className="bf-label">
                    PENERBIT <i>*</i>
                  </span>
                  <input
                    name="penerbit"
                    value={form.penerbit}
                    onChange={handleChange}
                    placeholder="Nama penerbit"
                    maxLength={100}
                    required
                  />
                </label>

                <div className="bf-field bf-full">
                  <span className="bf-label">UNGGAH SAMPUL BUKU</span>

                  <div className="bf-file">
                    <span className="bf-file-ico" aria-hidden="true">
                      🖼️
                    </span>
                    <label className="bf-file-btn">
                      Choose File
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePickCover}
                      />
                    </label>
                    <span className="bf-file-name">
                      {coverFileName ||
                        (currentCover && !coverRemoved ? currentCover : 'No file chosen')}
                    </span>
                    {coverPreview && (
                      <button type="button" className="bf-file-remove" onClick={handleRemoveCover}>
                        Hapus gambar
                      </button>
                    )}
                  </div>

                  <small className="bf-hint">Format: JPG, PNG, WEBP (Maksimal 3MB)</small>
                </div>
              </div>

              <div className="bf-note">
                <span className="bf-note-ico" aria-hidden="true">
                  ℹ️
                </span>
                <p>
                  Pastikan seluruh data sudah benar sebelum disimpan. Kolom bertanda{' '}
                  <b>*</b> wajib diisi. Pratinjau 3D di samping akan berubah otomatis mengikuti
                  isian form.
                </p>
              </div>

              <div className="bf-actions">
                <Link to="/buku" className="btn btn-outline">
                  Batalkan
                </Link>
                <button type="submit" className="btn btn-accent" disabled={saving}>
                  💾 {saving ? 'Menyimpan...' : isEdit ? 'Perbarui Buku' : 'Simpan Buku'}
                </button>
              </div>
            </form>

            {/* ---------------- Pratinjau 3D ---------------- */}
            <aside className="panel bf-preview">
              <div className="bf-preview-title">✦ LIVE 3D BOOK PREVIEW</div>
              <span className="bf-preview-chip">3D HARDCOVER</span>

              <BookPreview3D
                title={form.judul}
                author={form.penulis}
                year={form.tahun_terbit}
                kategori={form.kategori}
                image={coverPreview}
              />

              <dl className="bf-info">
                <div>
                  <dt>JUDUL</dt>
                  <dd>{form.judul || '-'}</dd>
                </div>
                <div>
                  <dt>PENULIS</dt>
                  <dd>{form.penulis || '-'}</dd>
                </div>
                <div>
                  <dt>TAHUN / PENERBIT</dt>
                  <dd>
                    {form.tahun_terbit || '-'} · {form.penerbit || '-'}
                  </dd>
                </div>
                <div>
                  <dt>KATEGORI</dt>
                  <dd>{form.kategori || '-'}</dd>
                </div>
              </dl>

              <div className="bf-field bf-desc">
                <span className="bf-label">DESKRIPSI SINGKAT (OTOMATIS)</span>
                <textarea className="bf-desc-box" readOnly value={deskripsi} rows={4} />
              </div>

              <p className="bf-preview-hint">
                👆 Klik dan geser buku untuk memutar pratinjau.
              </p>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
