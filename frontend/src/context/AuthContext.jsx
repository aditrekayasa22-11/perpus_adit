import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearSession, getUser, isLoggedIn, setSession } from '../api/client'

const AuthContext = createContext(null)

/**
 * Menyimpan status login (token + data user beserta role-nya).
 * Role tersimpan di user.role: 'admin' | 'petugas' | 'siswa'.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (isLoggedIn() ? getUser() : null))

  // Sinkronkan state login dengan client.js: saat token dicabut oleh server
  // (401) atau logout dipanggil dari tempat lain, state ini harus ikut reset.
  useEffect(() => {
    const sync = () => setUser(isLoggedIn() ? getUser() : null)
    window.addEventListener('perpus:session-cleared', sync)
    return () => window.removeEventListener('perpus:session-cleared', sync)
  }, [])

  /**
   * Login.
   * @param {string} username
   * @param {string} password
   * @param {'admin'|'petugas'|'siswa'} [role] role halaman login — server
   *   menolak bila role akun tidak sama dengan halaman yang dipakai.
   */
  const login = useCallback(async (username, password, role) => {
    const data = await api('/login', {
      method: 'POST',
      body: { username, password, ...(role ? { role } : {}) },
    })

    setSession(data.token, data.user)
    setUser(data.user)
    return data
  }, [])

  /**
   * Daftar akun baru (siswa / petugas) + langsung login.
   * @param {object} payload { name, username, email, password, password_confirmation, role }
   */
  const register = useCallback(async (payload) => {
    const data = await api('/register', { method: 'POST', body: payload })

    setSession(data.token, data.user)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      if (isLoggedIn()) await api('/logout', { method: 'POST' })
    } catch {
      /* token mungkin sudah expired, tetap lanjut logout */
    }
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
