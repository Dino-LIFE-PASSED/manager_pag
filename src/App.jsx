import { useState, useEffect } from 'react'
import { getToken, clearToken, setToken } from './lib/apiFetch.js'
import Login from './pages/Login.jsx'
import Hub from './pages/Hub.jsx'
import ApproveSerials from './pages/ApproveSerials.jsx'
import LineSettings from './pages/LineSettings.jsx'

export default function App() {
  const [auth, setAuth] = useState(null)
  const [page, setPage] = useState('hub')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.role !== 'admin') { clearToken(); setLoading(false); return }
      setAuth({ name: payload.name, role: payload.role })
    } catch {
      clearToken()
    }
    setLoading(false)
  }, [])

  function handleLogin({ token, name, role }) {
    setToken(token)
    setAuth({ name, role })
    setPage('hub')
  }

  function handleLogout() {
    clearToken()
    setAuth(null)
    setPage('hub')
  }

  if (loading) return null
  if (!auth) return <Login onLogin={handleLogin} />

  if (page === 'approve-serials') {
    return (
      <ApproveSerials
        auth={auth}
        onLogout={handleLogout}
        onBack={() => setPage('hub')}
      />
    )
  }

  if (page === 'line-settings') {
    return (
      <LineSettings
        auth={auth}
        onLogout={handleLogout}
        onBack={() => setPage('hub')}
      />
    )
  }

  return <Hub auth={auth} onLogout={handleLogout} onNavigate={setPage} />
}
