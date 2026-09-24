import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import { homeFor } from './config/site'
import { useAuth } from './context/AuthContext'
import ApiEndpoint from './pages/ApiEndpoint'
import BukuForm from './pages/BukuForm'
import Dashboard from './pages/Dashboard'
import DashboardPetugas from './pages/DashboardPetugas'
import DashboardSiswa from './pages/DashboardSiswa'
import DataBuku from './pages/DataBuku'
import KatalogPustakawan from './pages/KatalogPustakawan'
import KatalogPetugas from './pages/KatalogPetugas'
import KatalogUmum from './pages/KatalogUmum'
import KategoriBuku from './pages/KategoriBuku'
import Laporan from './pages/Laporan'
import Login from './pages/Login'
import Peminjaman from './pages/Peminjaman'
import PeminjamanSaya from './pages/PeminjamanSaya'
import Register from './pages/Register'
import ProtectedRoute from './routes/ProtectedRoute'

/**
 * Route /buku di-key berdasarkan query string (?q=&kategori=) sehingga
 * pencarian dari topbar / header form me-remount DataBuku dan nilai
 * awal pencariannya ikut berubah.
 */
function BukuPage() {
  const { search } = useLocation()
  return <DataBuku key={search || 'all'} />
}

/** Halaman publik: bila sudah login, langsung ke dashboard role-nya. */
function PublicOnly({ children }) {
  const { isAuthenticated, user } = useAuth()
  if (isAuthenticated) return <Navigate to={homeFor(user?.role)} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      {/* ---------- Halaman publik: login per role + register ---------- */}
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login role="admin" />
          </PublicOnly>
        }
      />
      <Route
        path="/login/petugas"
        element={
          <PublicOnly>
            <Login role="petugas" />
          </PublicOnly>
        }
      />
      <Route
        path="/login/siswa"
        element={
          <PublicOnly>
            <Login role="siswa" />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />

      {/* ---------- Halaman setelah login ---------- */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* "/" dialihkan ke dashboard sesuai role */}
        <Route path="/" element={<RoleHome />} />

        {/* Dashboard per role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-petugas"
          element={
            <ProtectedRoute roles={['petugas']}>
              <DashboardPetugas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-siswa"
          element={
            <ProtectedRoute roles={['siswa']}>
              <DashboardSiswa />
            </ProtectedRoute>
          }
        />

        {/* Data buku: dilihat semua role, kelola hanya admin */}
        <Route path="/buku" element={<BukuPage />} />
        <Route
          path="/buku/tambah"
          element={
            <ProtectedRoute roles={['admin']}>
              <BukuForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/buku/:id/edit"
          element={
            <ProtectedRoute roles={['admin']}>
              <BukuForm />
            </ProtectedRoute>
          }
        />

        {/* Menu admin */}
        <Route
          path="/kategori"
          element={
            <ProtectedRoute roles={['admin']}>
              <KategoriBuku />
            </ProtectedRoute>
          }
        />
        <Route
          path="/laporan"
          element={
            <ProtectedRoute roles={['admin']}>
              <Laporan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/katalog/pustakawan"
          element={
            <ProtectedRoute roles={['admin']}>
              <KatalogPustakawan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/katalog/petugas"
          element={
            <ProtectedRoute roles={['admin']}>
              <KatalogPetugas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/katalog/umum"
          element={
            <ProtectedRoute roles={['admin']}>
              <KatalogUmum />
            </ProtectedRoute>
          }
        />
        <Route
          path="/endpoint"
          element={
            <ProtectedRoute roles={['admin']}>
              <ApiEndpoint />
            </ProtectedRoute>
          }
        />

        {/* Peminjaman: diproses petugas & admin */}
        <Route
          path="/peminjaman"
          element={
            <ProtectedRoute roles={['petugas', 'admin']}>
              <Peminjaman />
            </ProtectedRoute>
          }
        />
        {/* Peminjaman milik siswa */}
        <Route
          path="/peminjaman-saya"
          element={
            <ProtectedRoute roles={['siswa']}>
              <PeminjamanSaya />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<RoleHome />} />
    </Routes>
  )
}

/** "/" atau URL tak dikenal → dashboard sesuai role user. */
function RoleHome() {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={homeFor(user?.role)} replace />
}
