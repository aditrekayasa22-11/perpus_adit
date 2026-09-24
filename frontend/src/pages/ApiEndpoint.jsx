import { useState } from 'react'
import { api, downloadFile } from '../api/client'
import './Katalog.css'

const BASE = 'http://localhost:8000/api'

/* Helper murni di luar komponen (hindari flag impure saat render). */
const now = () => Date.now()
const kodeAcak = () => `BK${Math.floor(100 + Math.random() * 900)}`

const contohBuku = {
  kode_buku: 'BK999',
  judul: 'Dicoba dari Halaman API',
  penulis: 'Administrator',
  kategori: 'Novel',
  tahun_terbit: 2026,
  penerbit: 'Perpustakaan',
}

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/login',
    auth: false,
    desc: 'Login admin, mengembalikan token',
    body: { username: 'admin', password: 'admin123' },
  },
  { method: 'GET', path: '/api/buku', auth: false, desc: 'Semua data buku (opsional ?q= pencarian)' },
  { method: 'GET', path: '/api/buku/{id}', auth: false, desc: 'Detail satu buku' },
  { method: 'GET', path: '/api/buku/{id}/cover', auth: false, desc: 'Gambar sampul (JPG/PNG/WEBP)' },
  {
    method: 'POST',
    path: '/api/buku',
    auth: true,
    desc: 'Tambah buku (kode dibuat acak agar tidak duplikat)',
    body: contohBuku,
  },
  { method: 'PUT', path: '/api/buku/{id}', auth: true, desc: 'Edit buku (mengirim ulang data tersebut)' },
  { method: 'DELETE', path: '/api/buku/{id}', auth: true, desc: 'Hapus buku — permanen!', danger: true },
  { method: 'GET', path: '/api/statistik', auth: true, desc: 'Statistik dashboard' },
  { method: 'GET', path: '/api/export/excel', auth: true, desc: 'Unduh laporan Excel (.xls)', download: 'data_buku.xls' },
  { method: 'GET', path: '/api/export/pdf', auth: true, desc: 'Unduh laporan PDF', download: 'data_buku.pdf' },
  { method: 'GET', path: '/api/me', auth: true, desc: 'Profil admin yang sedang login' },
  { method: 'POST', path: '/api/logout', auth: true, desc: 'Cabut token (wajib login ulang)' },
]

/**
 * Halaman dokumentasi JSON API Endpoint dengan tombol "Coba"
 * yang mengirim request sungguhan ke server Laravel.
 */
export default function ApiEndpoint() {
  const [running, setRunning] = useState('')
  const [output, setOutput] = useState(null)
  const [firstId, setFirstId] = useState(null)

  const jalankan = async (ep) => {
    const key = `${ep.method} ${ep.path}`
    const started = now()

    setRunning(key)
    setOutput(null)

    try {
      // Ganti {id} dengan id buku pertama agar request bisa diuji
      let path = ep.path
      let id = firstId

      if (path.includes('{id}')) {
        if (!id) {
          const list = await api('/buku')
          if (!list.data.length) throw new Error('Belum ada data buku untuk diuji.')
          id = list.data[0].id
          setFirstId(id)
        }
        path = path.replace('{id}', String(id))
      }

      const apiPath = path.replace('/api', '')

      // Unduhan file (Excel/PDF)
      if (ep.download) {
        await downloadFile(apiPath, ep.download)
        setOutput({
          title: key,
          status: '200 OK',
          ms: now() - started,
          body: `File ${ep.download} berhasil diunduh ke komputer Anda.`,
        })
        return
      }

      if (ep.danger) {
        const ok = window.confirm(
          `PERHATIAN: request ini akan MENGHAPUS buku id ${id} secara permanen. Lanjutkan?`,
        )
        if (!ok) {
          setOutput({ title: key, status: 'Dibatalkan', ms: 0, body: 'Request tidak dijalankan.' })
          return
        }
      }

      // Body: contoh acak untuk POST (hindari kode duplikat),
      // data buku tersebut untuk PUT.
      let body = ep.body
      if (ep.method === 'POST' && ep.path === '/api/buku') {
        body = { ...contohBuku, kode_buku: kodeAcak() }
      } else if (ep.method === 'PUT') {
        const detail = await api(apiPath)
        body = detail.data
        delete body.cover
        delete body.created_at
        delete body.updated_at
      }

      const res = await api(apiPath, { method: ep.method, body })

      setOutput({
        title: `${ep.method} ${path}`,
        status: '200 OK',
        ms: now() - started,
        body: res === null ? '(respons bukan JSON — file biner)' : JSON.stringify(res, null, 2),
      })
    } catch (err) {
      const detail = err.errors ? JSON.stringify(err.errors, null, 2) : ''
      setOutput({
        title: key,
        status: err.status ? `HTTP ${err.status}` : 'Gagal',
        ms: now() - started,
        body: [err.message, detail].filter(Boolean).join('\n\n'),
      })
    } finally {
      setRunning('')
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>JSON API Endpoint</h1>
          <p>Dokumentasi endpoint REST Laravel — klik <strong>Coba</strong> untuk mengirim request sungguhan</p>
        </div>
        <span className="panel-chip">{ENDPOINTS.length} endpoint</span>
      </div>

      <section className="panel ep-info">
        <div className="ep-info-row">
          <span>
            <b>Base URL</b>
            <code>{BASE}</code>
          </span>
          <span>
            <b>Auth</b>
            <code>Authorization: Bearer {'<token>'}</code>
          </span>
          <span>
            <b>Content-Type</b>
            <code>application/json</code>
          </span>
        </div>
        <p className="ep-note">
          ⚠️ Tombol <b>Coba</b> benar-benar mengirim request ke server: POST akan menambah data,
          PUT mengubah, dan <b>DELETE menghapus data</b> (ada dialog konfirmasi).
        </p>
      </section>

      <div className="ep-grid">
        <section className="panel ep-list">
          {ENDPOINTS.map((ep) => {
            const key = `${ep.method} ${ep.path}`
            const busy = running === key

            return (
              <div className="ep-row" key={key}>
                <span className={`ep-method m-${ep.method.toLowerCase()}`}>{ep.method}</span>

                <span className="ep-path">
                  <code>{ep.path}</code>
                  <small>{ep.desc}</small>
                </span>

                <span className={`ep-auth ${ep.auth ? 'need' : 'open'}`}>
                  {ep.auth ? '🔒 Token' : '🔓 Publik'}
                </span>

                <button
                  type="button"
                  className={`btn btn-sm ${ep.danger ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => jalankan(ep)}
                  disabled={running !== '' && !busy}
                >
                  {busy ? 'Menjalankan...' : 'Coba'}
                </button>
              </div>
            )
          })}
        </section>

        <section className="panel ep-console-wrap">
          <div className="panel-head">
            <h2>Respons Server</h2>
            {output && (
              <span className="panel-chip">
                {output.status} · {output.ms} ms
              </span>
            )}
          </div>

          {output ? (
            <>
              <div className="ep-console-title">{output.title}</div>
              <pre className="ep-console">{output.body}</pre>
            </>
          ) : (
            <div className="ep-placeholder">
              Belum ada request.
              <br />
              Pilih endpoint di kiri lalu klik <b>Coba</b>.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
