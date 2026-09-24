import { Navigate, useLocation } from 'react-router-dom'
import { homeFor, LOGIN_PATH } from '../config/site'
import { useAuth } from '../context/AuthContext'

/**
 * Guard route berbasis role.
 *
 * - Belum login   → dialihkan ke halaman login.
 * - Role tak diizinkan (props `roles`) → dialihkan ke dashboard role-nya.
 *
 * Status dibaca langsung dari context (bukan di-cache ke state) supaya
 * route ikut terkunci ketika token dicabut / session berakhir.
 *
 * @param {{ children: React.ReactNode, roles?: Array<'admin'|'petugas'|'siswa'> }} props
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    const lastRole = user?.role
    return (
      <Navigate
        to={LOGIN_PATH[lastRole] || '/login'}
        state={{ from: location }}
        replace
      />
    )
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={homeFor(user?.role)} replace />
  }

  return children
}
