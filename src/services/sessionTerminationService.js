import { setOidcAccessToken, getOidcUserManager } from './oidcTokenService'

let isTerminating = false

/**
 * Pembersihan sesi lokal terpusat untuk FlowGIS.
 * Dipanggil saat sesi Keycloak berakhir di tab lain, silent renew gagal, atau 401 tak tertangani.
 * PENTING: Jangan memanggil signoutRedirect() di sini untuk mencegah loop logout antar aplikasi.
 */
export const terminateLocalSession = async (reason = 'Sesi berakhir') => {
  if (isTerminating) return
  isTerminating = true

  try {
    // 1. Bersihkan token dari memori
    setOidcAccessToken(null)

    // 2. Bersihkan storage lokal
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('user')

        if (window.sessionStorage) {
          Object.keys(window.sessionStorage).forEach((k) => {
            if (k.startsWith('oidc.user:')) {
              window.sessionStorage.removeItem(k)
            }
          })
          window.sessionStorage.setItem('SESSION_EXPIRED', 'true')
          if (reason) {
            window.sessionStorage.setItem('SESSION_TERMINATED_MSG', reason)
          }
        }
      } catch {
        // Abaikan error storage
      }

      window.dispatchEvent(new Event('auth-change'))
    }

    // 3. Bersihkan user dari UserManager oidc-client-ts
    const userManager = getOidcUserManager()
    if (userManager) {
      try {
        await userManager.removeUser()
      } catch {
        // Abaikan error userManager
      }
    }
  } finally {
    // 4. Arahkan pengguna ke landing page jika sedang di halaman privat
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (currentPath !== '/' && !currentPath.startsWith('/auth') && currentPath !== '/login') {
        window.location.replace('/')
      }
    }

    setTimeout(() => {
      isTerminating = false
    }, 2000)
  }
}
