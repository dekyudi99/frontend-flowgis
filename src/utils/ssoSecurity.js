/**
 * Memvalidasi returnTo untuk mencegah kerentanan Open Redirect & Loop Redirect
 */
export const validateReturnTo = (returnTo, defaultPath = '/map') => {
  if (!returnTo || typeof returnTo !== 'string') {
    return defaultPath
  }

  const trimmed = returnTo.trim()

  // Harus diawali dengan satu '/'
  if (!trimmed.startsWith('/')) {
    return defaultPath
  }

  // Tolak protocol-relative URL (//evil.com)
  if (trimmed.startsWith('//')) {
    return defaultPath
  }

  // Tolak URL yang memiliki skema (http:, https:, javascript:, data:)
  if (trimmed.includes(':')) {
    return defaultPath
  }

  // Tolak self-referential sso/start route untuk mencegah loop
  if (trimmed.startsWith('/sso/start')) {
    return defaultPath
  }

  return trimmed
}
