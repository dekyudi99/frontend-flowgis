import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import useAuth from '../../hooks/useAuth'

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isLoading, user, roles, authType } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    )
  }

  // Jika belum login -> arahkan ke halaman login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  // Validasi role client FlowGIS: pastikan user memiliki minimal satu role valid (analyst / admin / app-flowgis)
  const validFlowgisRoles = ['analyst', 'admin', 'app-flowgis', 'user']
  const hasClientAccess = roles.some((r) => validFlowgisRoles.includes(r)) || validFlowgisRoles.includes(user?.role)

  if (!hasClientAccess) {
    const portalUrl = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5170'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center space-y-5 border border-gray-100">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-2xl">
            !
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900">Anda belum memiliki akses ke aplikasi ini</h3>
            <p className="text-sm text-gray-600">
              Akun SSO Anda belum memiliki role akses (analyst atau admin) untuk FlowGIS. Hubungi administrator platform untuk meminta akses.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <a
              href={portalUrl}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm transition-colors text-center"
            >
              Kembali ke Portal SSO
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Pengecekan role aplikasi (misal: admin untuk /admin)
  const userRole = user?.role || (roles.includes('admin') ? 'admin' : 'analyst')
  const isUnauthorized = allowedRoles && !allowedRoles.includes(userRole) && !roles.some((r) => allowedRoles.includes(r))

  if (isUnauthorized) {
    return (
      <Navigate 
        to="/map" 
        state={{ errorMsg: "Access denied. This page can only be accessed by an Admin." }} 
        replace 
      />
    )
  }

  return <Outlet />
}