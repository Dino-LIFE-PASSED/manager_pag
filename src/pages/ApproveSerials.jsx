import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../lib/apiFetch.js'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export default function ApproveSerials({ auth, onLogout, onBack }) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(null)
  const [error, setError] = useState('')

  const loadPending = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/serials/pending')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setGroups(data)
    } catch (err) {
      setError(err.message || 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPending() }, [loadPending])

  async function handleApprove(productId, ids) {
    setApproving(productId)
    setError('')
    try {
      const res = await apiFetch('/api/serials/approve', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await loadPending()
    } catch (err) {
      setError(err.message || 'Approve ไม่สำเร็จ')
    } finally {
      setApproving(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-8">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888] uppercase mb-2">Inventory</p>
          <h1 className="text-3xl font-bold text-[#111] tracking-tight leading-none">
            Approve Serials<span className="text-[#D41414]">.</span>
          </h1>
        </div>

        {error && (
          <p className="text-sm text-[#D41414] mb-4 px-1">{error}</p>
        )}

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-5 h-5 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white border border-[#E2E2E0] p-10 text-center">
            <p className="text-[10px] font-bold tracking-widest uppercase text-[#CCC] mb-3">All Clear</p>
            <p className="text-lg font-bold text-[#111]">ไม่มีรายการรอ Approve</p>
            <p className="text-sm text-[#AAA] mt-1">Serial ทุกรายการได้รับการ approve แล้ว</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groups.map(group => {
              const isApproving = approving === group.product_id
              const ids = group.serials.map(s => s.id)

              return (
                <div key={group.product_id} className="bg-white border border-[#E2E2E0]">
                  {/* Product header */}
                  <div className="px-5 py-4 border-b border-[#F4F4F4] flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#111] text-base leading-snug">{group.product_name}</p>
                      <p className="text-[10px] text-[#AAA] uppercase tracking-wider mt-0.5">{group.category}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border border-[#E2C97A] text-[#B07800]">
                      {group.serials.length} pending
                    </span>
                  </div>

                  {/* Serial list */}
                  <div className="divide-y divide-[#F4F4F4]">
                    {group.serials.map(s => (
                      <div key={s.id} className="px-5 py-3 flex items-center gap-4">
                        <span className="font-mono text-sm text-[#111] flex-1">{s.serial_number}</span>
                        <span className="text-[10px] text-[#AAA] shrink-0">
                          {s.received_by_name} · {formatDate(s.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Approve button */}
                  <div className="px-5 py-4 border-t border-[#F4F4F4]">
                    <button
                      onClick={() => handleApprove(group.product_id, ids)}
                      disabled={isApproving}
                      className="group flex items-center gap-3 bg-[#111] hover:bg-[#D41414] disabled:bg-[#888] disabled:cursor-not-allowed text-white px-6 py-3 text-xs font-bold tracking-widest uppercase transition-colors"
                    >
                      {isApproving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          Approve {group.serials.length} serial{group.serials.length > 1 ? 's' : ''}
                          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
