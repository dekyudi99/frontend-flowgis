import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import AuthContext from './AuthContext'
import { getMe, loginUser, logoutUser } from '../services/authService'
import { setOidcAccessToken, setOidcUserManager, getOidcAccessToken } from '../services/oidcTokenService'
import { terminateLocalSession } from '../services/sessionTerminationService'

const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const oidcAuth = useOidcAuth()

  const [user, setUser] = useState(null)
  const [authType, setAuthType] = useState(null) // 'keycloak' | 'legacy' | null
  const [isLegacyLoading, setIsLegacyLoading] = useState(true)

  // Simpan userManager OIDC ke service global untuk penanganan retry 401
  useEffect(() => {
    if (oidcAuth) {
      setOidcUserManager(oidcAuth)
    }
  }, [oidcAuth])

  // Daftarkan listener event OIDC: OP Signout (iframe check_session), Silent Renew Error, dan Token Expired
  useEffect(() => {
    if (!oidcAuth?.events) return

    const handleSessionEnded = async () => {
      setUser(null)
      setAuthType(null)
      await terminateLocalSession('Sesi berakhir')
    }

    oidcAuth.events.addUserSignedOut(handleSessionEnded)
    oidcAuth.events.addSilentRenewError(handleSessionEnded)
    oidcAuth.events.addAccessTokenExpired(handleSessionEnded)

    return () => {
      oidcAuth.events.removeUserSignedOut(handleSessionEnded)
      oidcAuth.events.removeSilentRenewError(handleSessionEnded)
      oidcAuth.events.removeAccessTokenExpired(handleSessionEnded)
    }
  }, [oidcAuth?.events])

  // Pengecekan sesi saat tab kembali aktif (visibilitychange & focus) dengan throttle 15 detik
  useEffect(() => {
    let lastCheckTime = 0
    const CHECK_THROTTLE_MS = 15000

    const handleVisibilityOrFocus = async () => {
      if (typeof document !== 'undefined' && document.visibilityState && document.visibilityState !== 'visible') {
        return
      }

      const now = Date.now()
      if (now - lastCheckTime < CHECK_THROTTLE_MS) {
        return
      }
      lastCheckTime = now

      if (oidcAuth.isAuthenticated || getOidcAccessToken()) {
        try {
          await oidcAuth.signinSilent()
        } catch {
          setUser(null)
          setAuthType(null)
          await terminateLocalSession('Sesi berakhir')
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus)
      document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus)
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      }
    }
  }, [oidcAuth])

  // Sinkronisasi status autentikasi Keycloak / Legacy
  useEffect(() => {
    let cancelled = false

    if (oidcAuth.isAuthenticated && oidcAuth.user?.access_token) {
      setOidcAccessToken(oidcAuth.user.access_token)
      localStorage.setItem('auth_token', oidcAuth.user.access_token)
      localStorage.setItem('token', oidcAuth.user.access_token)
      getMe()
        .then((res) => {
          if (!cancelled) {
            const userData = res.data || res.user || res
            setUser(userData)
            setAuthType('keycloak')
            localStorage.setItem('user_data', JSON.stringify(userData))
            localStorage.setItem('user', JSON.stringify(userData))
            window.dispatchEvent(new Event('auth-change'))
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error('Failed to resolve Keycloak user profile:', err)
            setUser(null)
            setAuthType(null)
            setOidcAccessToken(null)
          }
        })
        .finally(() => {
          if (!cancelled) setIsLegacyLoading(false)
        })
    } else if (!oidcAuth.isLoading) {
      setOidcAccessToken(null)
      const legacyToken = localStorage.getItem('auth_token') || localStorage.getItem('token')

      if (legacyToken) {
        getMe()
          .then((res) => {
            if (!cancelled) {
              const userData = res.data || res.user || res
              setUser(userData)
              setAuthType('legacy')
              localStorage.setItem('user_data', JSON.stringify(userData))
              localStorage.setItem('user', JSON.stringify(userData))
            }
          })
          .catch(() => {
            if (!cancelled) {
              setUser(null)
              setAuthType(null)
              localStorage.removeItem('auth_token')
              localStorage.removeItem('token')
              localStorage.removeItem('user_data')
              localStorage.removeItem('user')
            }
          })
          .finally(() => {
            if (!cancelled) setIsLegacyLoading(false)
          })
      } else {
        setUser(null)
        setAuthType(null)
        setIsLegacyLoading(false)
      }
    }

    return () => {
      cancelled = true
    }
  }, [oidcAuth.isAuthenticated, oidcAuth.isLoading, oidcAuth.user?.access_token])

  // Login manual lama
  const login = useCallback(async (payload) => {
    const res = await loginUser(payload)
    const userData = res.user || res.data?.user
    setUser(userData)
    setAuthType('legacy')
    return userData
  }, [])

  // Login dengan Keycloak SSO
  const signinRedirect = useCallback((args) => {
    return oidcAuth.signinRedirect(args)
  }, [oidcAuth])

  // Logout terpadu (RP-Initiated ke Keycloak dengan id_token_hint)
  const logout = useCallback(async () => {
    const portalUrl = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5170'
    const postLogoutUri = import.meta.env.VITE_KEYCLOAK_POST_LOGOUT_REDIRECT_URI || portalUrl
    const idToken = oidcAuth.user?.id_token

    try {
      if (authType === 'keycloak' || oidcAuth.isAuthenticated || idToken) {
        try {
          await oidcAuth.signoutRedirect({
            id_token_hint: idToken,
            post_logout_redirect_uri: postLogoutUri,
          })
          return
        } catch (signoutErr) {
          console.warn('OIDC signoutRedirect error, direct navigation fallback:', signoutErr)
          const authority = import.meta.env.VITE_KEYCLOAK_AUTHORITY || 'http://localhost:8081/realms/wefgis'
          const logoutUrl = `${authority}/protocol/openid-connect/logout?${idToken ? `id_token_hint=${encodeURIComponent(idToken)}&` : ''}post_logout_redirect_uri=${encodeURIComponent(postLogoutUri)}`
          window.location.href = logoutUrl
          return
        }
      }
      await logoutUser()
    } catch (e) {
      console.warn('Logout error:', e)
    } finally {
      setOidcAccessToken(null)
      setUser(null)
      setAuthType(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
      localStorage.removeItem('user_data')
      localStorage.removeItem('user')
      window.dispatchEvent(new Event('auth-change'))
    }
  }, [authType, oidcAuth])

  const isLoading = oidcAuth.isLoading || isLegacyLoading

  const value = useMemo(
    () => ({
      user,
      roles: user?.roles || (user?.role ? [user.role] : []),
      isLoading,
      isAuthenticated: Boolean(user),
      authType,
      login,
      signinRedirect,
      logout,
      oidcAuth,
    }),
    [user, isLoading, authType, login, signinRedirect, logout, oidcAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
