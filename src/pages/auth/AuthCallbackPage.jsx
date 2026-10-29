import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import { Loader2, AlertCircle } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import { validateReturnTo } from '../../utils/ssoSecurity'

const AuthCallbackPage = () => {
  const oidcAuth = useOidcAuth()
  const { isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const rawReturnTo = oidcAuth.user?.state?.returnTo || (typeof window !== 'undefined' ? sessionStorage.getItem('SSO_RETURN_TO') : null)
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('SSO_RETURN_TO')
      }

      const targetPath = validateReturnTo(rawReturnTo, '/map')
      navigate(targetPath, { replace: true })
    }
  }, [isLoading, isAuthenticated, user, oidcAuth.user?.state?.returnTo, navigate])

  if (oidcAuth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full p-6 bg-white rounded-2xl shadow-xl space-y-4 text-center border border-gray-100">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">SSO Login Failed</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {oidcAuth.error.message || 'An error occurred while verifying Keycloak session.'}
          </p>
          <button
            type="button"
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors"
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to Login Page
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600 mx-auto" />
        <p className="text-sm text-gray-600 font-medium">
          Verifying Keycloak SSO session...
        </p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
