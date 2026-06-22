const TOKEN_KEY = 'manager_token'
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(t) {
  localStorage.setItem(TOKEN_KEY, t)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function apiFetch(path, opts = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opts.headers,
  }
  return fetch(`${API_BASE}${path}`, { ...opts, headers }).then(res => {
    const newToken = res.headers.get('X-New-Token')
    if (newToken) setToken(newToken)
    return res
  })
}
