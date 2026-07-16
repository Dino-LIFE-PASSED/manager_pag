import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/apiFetch.js'

export default function LineSettings({ auth, onLogout, onBack }) {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/settings/line')
      .then(r => r.json())
      .then(d => setStatus(d))
      .catch(() => setError('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [])

  async function handleTest() {
    setTesting(true)
    setResult(null)
    setError('')
    try {
      const res = await apiFetch('/api/settings/line/test', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult('ส่งสำเร็จ — เช็ค LINE ได้เลย')
    } catch (err) {
      setError(err.message || 'ส่งไม่สำเร็จ')
    } finally {
      setTesting(false)
    }
  }

  const bg = (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
      {[12, 25, 38, 51, 64, 77, 90].map(x => (
        <div key={x} className="absolute top-0 bottom-0 w-px bg-[#E2E2E0]" style={{ left: `${x}%` }} />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col">
      {bg}

      <header className="sticky top-0 z-20 bg-[#F8F8F8] border-b border-[#E2E2E0] px-4 md:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/PAG Logo.png" alt="PAG" className="h-8 md:h-10 w-auto" />
          <div className="hidden sm:block w-px h-6 bg-[#E2E2E0]" />
          <button
            onClick={onBack}
            className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase hover:text-[#111] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Manager Hub
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#888] hidden sm:block">{auth.name}</span>
          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border border-[#111] text-[#111]">
            {auth.role}
          </span>
          <button
            onClick={onLogout}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#888] hover:text-[#D41414] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 px-4 md:px-10 py-10 max-w-3xl mx-auto w-full">
        <div className="mb-10">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888] uppercase mb-2">Notification</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#111] tracking-tight leading-none">
            LINE Alert<span className="text-[#D41414]">.</span>
          </h1>
          <p className="text-sm text-[#888] mt-3">
            เมื่อ Dealer สั่งออเดอร์ใหม่ ระบบจะส่ง LINE ไปหา Staff ทันที
          </p>
        </div>

        {loading ? (
          <div className="text-sm text-[#888]">กำลังโหลด...</div>
        ) : (
          <div className="space-y-px bg-[#E2E2E0]">
            <div className="bg-white p-8">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-4">สถานะ</p>
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${status?.configured ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="text-sm font-semibold text-[#111]">
                  {status?.configured ? 'พร้อมใช้งาน' : 'ยังไม่ได้ตั้งค่า'}
                </span>
              </div>
            </div>

            {status?.configured && (
              <div className="bg-white p-8">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-4">Staff User ID</p>
                <p className="font-mono text-sm text-[#111]">{status.userId}</p>
              </div>
            )}

            <div className="bg-white p-8">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-4">ทดสอบ</p>
              <p className="text-sm text-[#888] mb-6">
                กด Send Test เพื่อส่งข้อความทดสอบไปยัง LINE ของ Staff
              </p>

              {error && <p className="text-[#D41414] text-sm font-medium mb-4">{error}</p>}
              {result && <p className="text-green-600 text-sm font-medium mb-4">{result}</p>}

              <button
                onClick={handleTest}
                disabled={testing || !status?.configured}
                className="group flex items-center gap-4 bg-[#111111] hover:bg-[#D41414] disabled:bg-[#CCC] text-white px-8 py-4 font-semibold tracking-wide text-sm transition-colors duration-200"
              >
                {testing ? 'กำลังส่ง...' : 'Send Test'}
                {!testing && (
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 px-4 md:px-10 pb-8 pt-4">
        <div className="border-t border-[#E2E2E0] pt-4 flex justify-between">
          <span className="text-xs text-[#AAA]">© 2025 Pro Audio Gadgets</span>
          <span className="text-xs text-[#AAA] tracking-widest uppercase hidden sm:block">Manager Access Only</span>
        </div>
      </footer>
    </div>
  )
}
