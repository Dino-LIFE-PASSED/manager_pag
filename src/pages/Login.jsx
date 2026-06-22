import { useState } from 'react'
import { apiFetch } from '../lib/apiFetch.js'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
      if (data.needsPassword) {
        setStep('setPassword')
        setPassword('')
        return
      }
      if (data.role !== 'admin') throw new Error('ระบบนี้สำหรับ Admin เท่านั้น')
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) return setError('Password ไม่ตรงกัน')
    setLoading(true)
    try {
      const res = await apiFetch('/api/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ username, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด')
      if (data.role !== 'admin') throw new Error('ระบบนี้สำหรับ Admin เท่านั้น')
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const bg = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[20, 35, 50, 65, 80].map(x => (
        <div key={x} className="absolute top-0 bottom-0 w-px bg-[#E2E2E0]" style={{ left: `${x}%` }} />
      ))}
    </div>
  )

  const arrowIcon = (
    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {bg}

      <header className="relative z-10 px-8 pt-8 flex items-center justify-between">
        <img src="/PAG Logo.png" alt="Pro Audio Gadgets" className="h-10 w-auto" />
      </header>

      <div className="relative z-10 flex-1 flex items-center px-8 md:px-20">
        <div className="w-full max-w-md">

          {step === 'login' ? (
            <>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#888] uppercase mb-6">
                Manager Portal
              </p>
              <h1 className="text-5xl md:text-6xl font-bold text-[#111111] leading-none mb-12 tracking-tight">
                Manager<br />
                Hub<span className="text-[#D41414]">.</span>
              </h1>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-[#888] uppercase mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#111111] py-3 text-[#111111] text-base font-medium placeholder:text-[#BBBBB8] focus:outline-none focus:border-[#D41414] transition-colors text-[16px]"
                    placeholder="Username"
                    required
                    autoFocus
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-[#888] uppercase mb-2 mt-6">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#111111] py-3 text-[#111111] text-base font-medium placeholder:text-[#BBBBB8] focus:outline-none focus:border-[#D41414] transition-colors text-[16px]"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && <p className="text-[#D41414] text-sm font-medium pt-1">{error}</p>}

                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex items-center gap-4 bg-[#111111] hover:bg-[#D41414] disabled:bg-[#888] text-white px-8 py-4 font-semibold tracking-wide text-sm transition-colors duration-200"
                  >
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    {!loading && arrowIcon}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#888] uppercase mb-6">
                ตั้ง Password ครั้งแรก
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-[#111111] leading-none mb-4 tracking-tight">
                Welcome<span className="text-[#D41414]">.</span>
              </h1>
              <p className="text-sm text-[#888] mb-10">
                Account <span className="font-semibold text-[#111]">{username}</span> ยังไม่มี password<br />
                ตั้งได้เลย แล้วใช้งานได้ทันที
              </p>

              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-[#888] uppercase mb-2">
                    Password ใหม่
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#111111] py-3 text-[#111111] text-base font-medium placeholder:text-[#BBBBB8] focus:outline-none focus:border-[#D41414] transition-colors text-[16px]"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    required
                    minLength={6}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-widest text-[#888] uppercase mb-2 mt-6">
                    ยืนยัน Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-[#111111] py-3 text-[#111111] text-base font-medium placeholder:text-[#BBBBB8] focus:outline-none focus:border-[#D41414] transition-colors text-[16px]"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && <p className="text-[#D41414] text-sm font-medium pt-1">{error}</p>}

                <div className="pt-8 flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex items-center gap-4 bg-[#111111] hover:bg-[#D41414] disabled:bg-[#888] text-white px-8 py-4 font-semibold tracking-wide text-sm transition-colors duration-200"
                  >
                    {loading ? 'กำลังบันทึก...' : 'ตั้ง Password และเข้าสู่ระบบ'}
                    {!loading && arrowIcon}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep('login'); setError(''); setNewPassword(''); setConfirmPassword('') }}
                    className="text-sm text-[#AAA] hover:text-[#111] transition-colors"
                  >
                    ย้อนกลับ
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <footer className="relative z-10 px-8 pb-8">
        <div className="border-t border-[#E2E2E0] pt-4 flex items-center justify-between">
          <span className="text-xs text-[#AAA]">© 2025 Pro Audio Gadgets</span>
          <span className="text-xs text-[#AAA] tracking-widest uppercase">Manager Access Only</span>
        </div>
      </footer>
    </div>
  )
}
