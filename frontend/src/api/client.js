/**
 * HTTP Client untuk memanggil API Laravel (JSON).
 * Token disimpan di localStorage dan otomatis dikirim
 * pada setiap request lewat header Authorization: Bearer.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const TOKEN_KEY = 'perpus_token'
const USER_KEY = 'perpus_user'

/** Base URL API, dipakai untuk membuat URL gambar sampul. */
export const apiBase = API_URL

/**
 * Baca File gambar menjadi data URL (base64) untuk dikirim ke API.
 */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
    reader.readAsDataURL(file)
  })
}

// ---------- Token & User ----------
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

export const setSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  // Beri tahu AuthContext bahwa session sudah berakhir (mis. kena 401)
  window.dispatchEvent(new Event('perpus:session-cleared'))
}

export const isLoggedIn = () => Boolean(getToken())

/**
 * Request helper.
 * @param {string} path  contoh: "/buku" atau "/buku/1"
 * @param {object} options { method, body, query }
 */
export async function api(path, { method = 'GET', body, query } = {}) {
  let url = `${API_URL}${path}`

  if (query) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== '' && v !== null && v !== undefined),
    )
    const qs = params.toString()
    if (qs) url += `?${qs}`
  }

  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Tidak dapat terhubung ke server API. Pastikan `php artisan serve` berjalan.')
  }

  // 204 No Content
  if (res.status === 204) return null

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json() : null

  if (!res.ok) {
    // Token kedaluwarsa / tidak valid → paksa logout + reset state React
    if (res.status === 401 && getToken()) clearSession()

    const error = new Error(
      data?.message || data?.error || `Terjadi kesalahan (HTTP ${res.status}).`,
    )
    error.status = res.status
    error.errors = data?.errors || null
    throw error
  }

  return data
}

/**
 * Download file terproteksi (Excel/PDF) dengan header Authorization,
 * lalu simpan ke komputer pengguna.
 */
export async function downloadFile(path, filename) {
  const url = `${API_URL}${path}`
  const headers = { Accept: '*/*' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, { headers })

  if (!res.ok) {
    let message = `Gagal mengunduh file (HTTP ${res.status}).`
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      /* abaikan */
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') || ''

  // Ambil nama file dari header bila tersedia
  const match = disposition.match(/filename="?([^";]+)"?/i)
  const name = match ? match[1] : filename

  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(blobUrl)
}
