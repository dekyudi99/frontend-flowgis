import { WebStorageStateStore } from 'oidc-client-ts'

const keycloakUrl = (import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081').replace(/\/+$/, '')
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM || 'wefgis'
const defaultAuthority = `${keycloakUrl}/realms/${keycloakRealm}`

export const oidcConfig = {
  authority: import.meta.env.VITE_KEYCLOAK_AUTHORITY || defaultAuthority,
  client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'flowgis',
  redirect_uri: import.meta.env.VITE_KEYCLOAK_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri:
    import.meta.env.VITE_KEYCLOAK_POST_LOGOUT_REDIRECT_URI ||
    import.meta.env.VITE_PORTAL_URL ||
    'http://localhost:5170',
  response_type: 'code',
  scope: 'openid profile email',
  automaticSilentRenew: true,
  monitorSession: true,
  checkSessionIntervalInSeconds: 2,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname)
  },
}
