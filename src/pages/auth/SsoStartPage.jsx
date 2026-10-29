import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import { Loader2, AlertCircle } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { validateReturnTo } from '../../utils/ssoSecurity'

const SsoStartPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const oidcAuth = useOidcAuth()
  const { isAuthenticated, isLoading, user, signinRedirect } = useAuth()
  const [errorMsg, setErrorMsg] = useState(null)
  const isInitiatedRef = useRef(false)

  const rawReturnTo = searchParams.get('returnTo')
  const safeReturnTo = validateReturnTo(rawReturnTo, '/map')

  useEffect(() => {
    // 1. Cek error dari URL parameter atau OIDC error
    const urlError = searchParams.get('error')
    const urlErrorDesc = searchParams.get('error_description')
    if (urlError) {
      setErrorMsg(urlErrorDesc || urlError)
      return
    }
    if (oidcAuth.error) {
      setErrorMsg(oidcAuth.error.message || 'Gagal memulai sesi SSO Keycloak.')
      return
    }

    // 2. Jika user SUDAH login lokal -> langsung navigasi ke tujuan tanpa redirect ulang
    if (!isLoading && isAuthenticated && user) {
      navigate(safeReturnTo, { replace: true })
      return
    }

    // 3. Jika belum login dan belum memulai redirect -> panggil signinRedirect
    if (!isLoading && !isAuthenticated && !isInitiatedRef.current) {
      isInitiatedRef.current = true
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('SSO_RETURN_TO', safeReturnTo)
      }

      signinRedirect({ state: { returnTo: safeReturnTo } }).catch((err) => {
        setErrorMsg(err.message || 'Tidak dapat mengalihkan ke Keycloak.')
      })
    }
  }, [isLoading, isAuthenticated, user, safeReturnTo, searchParams, oidcAuth.error, signinRedirect, navigate])

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-2xl shadow-xl space-y-4 text-center border border-gray-100">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Gagal Masuk via SSO</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{errorMsg}</p>
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
              onClick={() => {
                setErrorMsg(null)
                isInitiatedRef.current = false
                signinRedirect({ state: { returnTo: safeReturnTo } })
              }}
            >
              Coba Lagi
            </button>
            <button
              type="button"
              className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
              onClick={() => navigate('/', { replace: true })}
            >
              Ke Beranda
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
        <p className="text-sm text-gray-600 font-medium">
          Redirecting to FlowGIS Dashboard...
        </p>
      </div>
    </div>
  )
}

export default SsoStartPage
