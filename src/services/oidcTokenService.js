import { terminateLocalSession } from './sessionTerminationService'

let _accessToken = null
let _userManager = null
let isRefreshing = false
let refreshPromise = null

export const setOidcAccessToken = (token) => {
  _accessToken = token || null
}

export const setOidcUserManager = (manager) => {
  _userManager = manager || null
}

export const getOidcUserManager = () => _userManager

export const getOidcAccessToken = () => {
  if (_accessToken) return _accessToken

  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i)
        if (key && key.startsWith('oidc.user:')) {
          const raw = window.sessionStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed?.access_token) {
              _accessToken = parsed.access_token
              return _accessToken
            }
          }
        }
      }
    } catch {
      // Abaikan parse error
    }
  }

  return null
}

export const applyOidcInterceptor = (axiosInstance) => {
  // Request Interceptor: sisipkan token OIDC Bearer (atau fallback ke auth_token di localStorage)
  axiosInstance.interceptors.request.use((config) => {
    const oidcToken = getOidcAccessToken()
    if (oidcToken) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${oidcToken}`
    } else {
      const legacyToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || localStorage.getItem('token') : null
      if (legacyToken) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${legacyToken}`
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  })

  // Response Interceptor: Tangani 401, coba silent renew sekali, lalu terminate jika gagal
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true
        const userManager = getOidcUserManager()

        if (userManager && getOidcAccessToken()) {
          try {
            if (!isRefreshing) {
              isRefreshing = true
              refreshPromise = userManager.signinSilent().then((newUser) => {
                if (newUser?.access_token) {
                  setOidcAccessToken(newUser.access_token)
                  return newUser.access_token
                }
                return null
              }).finally(() => {
                isRefreshing = false
                refreshPromise = null
              })
            }

            const newToken = await refreshPromise
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {}
              originalRequest.headers.Authorization = `Bearer ${newToken}`
              return axiosInstance(originalRequest)
            }
          } catch {
            // Token renewal gagal
          }
        }

        await terminateLocalSession('Sesi berakhir')
      } else if (error.response?.status === 401) {
        await terminateLocalSession('Sesi berakhir')
      }

      return Promise.reject(error)
    }
  )

  return axiosInstance
}
