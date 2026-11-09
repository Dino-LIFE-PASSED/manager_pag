import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/apiFetch.js'

const TABS = [
  { id: 'stock', label: 'Stock' },
  { id: 'orders', label: 'Orders' },
  { id: 'serials', label: 'Serial Search' },
]

const STATUS_STYLE = {
  pending: 'text-[#B07800] border-[#E2C97A]',
  approved: 'text-green-700 border-green-300',
  shipped: 'text-[#888] border-[#E2E2E0]',
  preparing: 'text-[#B07800] border-[#E2C97A]',
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

async function getJson(path) {
  const res = await apiFetch(path)
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? `โหลดข้อมูลไม่สำเร็จ (${res.status})`)
  return data
}

function StatusBadge({ status }) {
  return (
    <span className={`shrink-0 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border ${STATUS_STYLE[status] ?? 'text-[#111] border-[#111]'}`}>
      {status}
    </span>
  )
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#E2E2E0] focus-within:border-[#111] transition-colors pb-1 mb-6">
      <svg className="w-3.5 h-3.5 text-[#CCC] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 py-1.5 bg-transparent text-[#111] placeholder:text-[#CCC] focus:outline-none text-base"
      />
    </div>
  )
}

function Spinner() {
  return (
    <div className="py-16 flex justify-center">
      <div className="w-5 h-5 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function Empty({ children }) {
  return <div className="bg-white border border-[#E2E2E0] p-10 text-center text-sm text-[#AAA]">{children}</div>
}

// ── Stock ────────────────────────────────────────────────────────────────

function Qty({ label, value, warn }) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-[#AAA]">{label}</p>
      <p className={`text-lg font-bold leading-tight ${warn ? 'text-[#D41414]' : 'text-[#111]'}`}>{value}</p>
    </div>
  )
}

function StockView() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    getJson('/api/stock/overview').then(setProducts).catch(err => setError(err.message))
  }, [])

  if (error) return <p className="text-sm text-[#D41414] px-1">{error}</p>
  if (!products) return <Spinner />

  // stock_qty is incremented on approve, so it should always equal the approved (in-warehouse) serial count
  const isMismatch = p => p.stock_qty !== p.serials.approved
  const hasActivity = p => p.stock_qty || p.serials.pending || p.serials.approved || p.serials.shipped
  const mismatchCount = products.filter(isMismatch).length

  const q = search.trim().toLowerCase()
  const visible = products
    .filter(p => showAll || hasActivity(p) || isMismatch(p))
    .filter(p => !q || (p.name ?? '').toLowerCase().includes(q) || (p.category ?? '').toLowerCase().includes(q))
    .sort((a, b) => isMismatch(b) - isMismatch(a))

  return (
    <>
      <SearchInput value={search} onChange={setSearch} placeholder="Search product or category..." />

      <div className="flex items-center justify-between gap-4 mb-4">
        <p className={`text-xs font-semibold ${mismatchCount ? 'text-[#D41414]' : 'text-green-700'}`}>
          {mismatchCount ? `${mismatchCount} สินค้า stock ไม่ตรงกับ serial` : 'Stock ตรงกับ serial ทุกรายการ'}
        </p>
        <label className="flex items-center gap-2 text-xs text-[#888] cursor-pointer select-none">
          <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} className="accent-[#111]" />
          แสดงสินค้าที่ไม่มีของด้วย
        </label>
      </div>

      {visible.length === 0 ? <Empty>ไม่พบสินค้า</Empty> : (
        <div className="flex flex-col gap-3">
          {visible.map(p => {
            const mismatch = isMismatch(p)
            return (
              <div key={p.id} className={`bg-white border p-5 ${mismatch ? 'border-[#D41414]' : 'border-[#E2E2E0]'}`}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <p className="font-bold text-[#111] leading-snug">{p.name}</p>
                    <p className="text-[10px] text-[#AAA] uppercase tracking-wider mt-0.5">
                      {p.category}{p.discontinue ? ' · discontinued' : ''}
                    </p>
                  </div>
                  {mismatch && (
                    <span className="shrink-0 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 border border-[#D41414] text-[#D41414]">
                      Mismatch
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-3 pb-4 border-b border-[#F4F4F4]">
                  <Qty label="Stock" value={p.stock_qty} warn={mismatch} />
                  <Qty label="Reserved" value={p.reserved_qty} />
                  <Qty label="Demo" value={p.demo_qty} />
                  <Qty label="Shop" value={p.shop_qty} />
                </div>

                <p className="text-[10px] font-bold tracking-widest uppercase text-[#111] pt-4 mb-2">Serial</p>
                <div className="grid grid-cols-4 gap-3">
                  <Qty label="In stock" value={p.serials.approved} warn={mismatch} />
                  <Qty label="Pending" value={p.serials.pending} />
                  <Qty label="Shipped" value={p.serials.shipped} />
                </div>

                {mismatch && (
                  <p className="text-xs text-[#D41414] mt-4">
                    Stock = {p.stock_qty} แต่มี serial ในคลัง {p.serials.approved} ตัว
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

// ── Orders ───────────────────────────────────────────────────────────────

function OrderItem({ item, orderStatus, onOpenSerial, onSwapped }) {
  // A shipped order should carry exactly one serial per unit
  const missing = orderStatus === 'shipped' && item.serials.length !== item.quantity
  const [editing, setEditing] = useState(false)
  const [oldSerial, setOldSerial] = useState(null)   // serial being replaced
  const [available, setAvailable] = useState(null)   // approved + unassigned serials of this product
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function startEdit() {
    setEditing(true)
    setOldSerial(null)
    setError('')
    setAvailable(null)
    getJson(`/api/shipping/serials/${item.product_id}`)
      .then(setAvailable)
      .catch(err => { setAvailable([]); setError(err.message) })
  }

  function cancelEdit() {
    setEditing(false)
    setOldSerial(null)
    setError('')
  }

  async function swapTo(newSerial) {
    if (!window.confirm(`เปลี่ยน S/N ${oldSerial.serial_number} → ${newSerial.serial_number} ?\n\n${oldSerial.serial_number} จะกลับเข้าคลัง`)) return
    setSaving(true)
    setError('')
    try {
      const res = await apiFetch('/api/stock/swap-serial', {
        method: 'POST',
        body: JSON.stringify({ order_item_id: item.id, old_serial_id: oldSerial.id, new_serial_id: newSerial.id }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? `เปลี่ยนไม่สำเร็จ (${res.status})`)
      await onSwapped()
      cancelEdit()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-5 py-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-semibold text-[#111]">{item.product_name}</p>
        <div className="shrink-0 flex items-center gap-3">
          <span className={`text-xs font-semibold ${missing ? 'text-[#D41414]' : 'text-[#888]'}`}>
            {item.serials.length}/{item.quantity} S/N
          </span>
          {item.serials.length > 0 && (
            <button
              onClick={editing ? cancelEdit : startEdit}
              className="text-[10px] font-bold tracking-widest uppercase text-[#AAA] hover:text-[#111] underline underline-offset-4 transition-colors"
            >
              {editing ? 'Cancel' : 'Edit S/N'}
            </button>
          )}
        </div>
      </div>

      {item.serials.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {item.serials.map(s => {
            const isOld = oldSerial?.id === s.id
            return (
              <button
                key={s.id}
                onClick={() => editing ? setOldSerial(s) : onOpenSerial(s.serial_number)}
                className={`font-mono text-xs px-2 py-1 border transition-colors ${
                  isOld ? 'border-[#D41414] text-[#D41414] line-through'
                    : editing ? 'border-dashed border-[#888] text-[#111] hover:border-[#D41414]'
                    : 'border-[#E2E2E0] text-[#111] hover:border-[#111]'
                }`}
              >
                {s.serial_number}
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-[#AAA] mt-1">ยังไม่ได้ผูก serial</p>
      )}

      {editing && (
        <div className="mt-3 p-3 bg-[#F8F8F8] border border-[#E2E2E0]">
          {!oldSerial ? (
            <p className="text-xs text-[#888]">1. กดเลือก S/N ที่ส่งผิดด้านบน</p>
          ) : available === null ? (
            <p className="text-xs text-[#888]">กำลังโหลด S/N ในคลัง...</p>
          ) : available.length === 0 ? (
            <p className="text-xs text-[#D41414]">ไม่มี S/N ของสินค้านี้ว่างในคลัง</p>
          ) : (
            <>
              <p className="text-xs text-[#888] mb-2">2. เลือก S/N ที่ถูกต้องแทน <span className="font-mono text-[#D41414]">{oldSerial.serial_number}</span></p>
              <div className="flex flex-wrap gap-1.5">
                {available.map(s => (
                  <button
                    key={s.id}
                    disabled={saving}
                    onClick={() => swapTo(s)}
                    className="font-mono text-xs px-2 py-1 border border-green-300 text-green-700 bg-white hover:border-green-700 disabled:opacity-50 transition-colors"
                  >
                    {s.serial_number}
                  </button>
                ))}
              </div>
            </>
          )}
          {error && <p className="text-xs text-[#D41414] mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}

function OrdersView({ onOpenSerial }) {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  function reload() {
    return getJson('/api/stock/orders').then(setOrders).catch(err => setError(err.message))
  }

  useEffect(() => { reload() }, [])

  if (error) return <p className="text-sm text-[#D41414] px-1">{error}</p>
  if (!orders) return <Spinner />

  const q = search.trim().toLowerCase()
  const visible = !q ? orders : orders.filter(o =>
    [o.invoice_number, o.dealer_name, o.company_name].some(v => (v ?? '').toLowerCase().includes(q)) ||
    o.items.some(i =>
      (i.product_name ?? '').toLowerCase().includes(q) ||
      i.serials.some(s => s.serial_number.toLowerCase().includes(q))
    )
  )

  return (
    <>
      <SearchInput value={search} onChange={setSearch} placeholder="Invoice, dealer, product or serial..." />

      {visible.length === 0 ? <Empty>ไม่พบ Order</Empty> : (
        <div className="flex flex-col gap-3">
          {visible.map(o => (
            <div key={o.id} className="bg-white border border-[#E2E2E0]">
              <div className="px-5 py-4 border-b border-[#F4F4F4] flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-bold text-[#111] font-mono">{o.invoice_number ?? '—'}</p>
                  <p className="text-xs text-[#888] mt-0.5 truncate">
                    {o.company_name || o.dealer_name || 'Unknown'}{o.company_name && o.dealer_name ? ` · ${o.dealer_name}` : ''} · {formatDate(o.created_at)}
                  </p>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="divide-y divide-[#F4F4F4]">
                {o.items.map(i => (
                  <OrderItem key={i.id} item={i} orderStatus={o.status} onOpenSerial={onOpenSerial} onSwapped={reload} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

// ── Serial search ────────────────────────────────────────────────────────

function SerialsView({ search, setSearch }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = search.trim()
    if (!q) { setResults([]); setError(''); return }
    let cancelled = false
    const t = setTimeout(() => {
      setLoading(true)
      getJson(`/api/stock/serials?q=${encodeURIComponent(q)}`)
        .then(data => { if (!cancelled) { setResults(data); setError('') } })
        .catch(err => { if (!cancelled) setError(err.message) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [search])

  return (
    <>
      <SearchInput value={search} onChange={setSearch} placeholder="Serial number..." />

      {error ? <p className="text-sm text-[#D41414] px-1">{error}</p>
        : loading ? <Spinner />
        : !search.trim() ? <Empty>พิมพ์ serial number เพื่อค้นหา</Empty>
        : results.length === 0 ? <Empty>ไม่พบ serial นี้</Empty>
        : (
          <div className="flex flex-col gap-3">
            {results.map(s => (
              <div key={s.id} className="bg-white border border-[#E2E2E0] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-[#111] text-lg">{s.serial_number}</p>
                    <p className="text-sm text-[#111] mt-0.5">{s.product_name ?? 'Unknown product'}</p>
                    <p className="text-[10px] text-[#AAA] uppercase tracking-wider mt-0.5">{s.category}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="mt-4 pt-4 border-t border-[#F4F4F4] flex flex-col gap-2 text-xs">
                  <p className="text-[#888]">
                    <span className="font-semibold text-[#111]">รับเข้า</span> {formatDate(s.received_at)} · โดย {s.received_by ?? 'Unknown'}
                  </p>
                  {s.order ? (
                    <p className="text-[#888]">
                      <span className="font-semibold text-[#111]">ส่งให้</span>{' '}
                      {s.order.company_name || s.order.dealer_name || 'Unknown'} ·{' '}
                      <span className="font-mono text-[#111]">{s.order.invoice_number}</span> · {formatDate(s.shipped_at)}
                    </p>
                  ) : (
                    <p className="text-[#AAA]">ยังไม่ได้ผูกกับ Order</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function StockTrace({ auth, onLogout, onBack }) {
  const [tab, setTab] = useState('stock')
  const [serialSearch, setSerialSearch] = useState('')

  function openSerial(serialNumber) {
    setSerialSearch(serialNumber)
    setTab('serials')
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
          <button
            onClick={onBack}
            className="sm:hidden flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Manager Hub
          </button>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888] uppercase mb-2">Inventory</p>
          <h1 className="text-3xl font-bold text-[#111] tracking-tight leading-none">
            Stock & Trace<span className="text-[#D41414]">.</span>
          </h1>
        </div>

        <div className="flex border-b border-[#E2E2E0] mb-6">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-[10px] font-bold tracking-widest uppercase border-b-2 -mb-px transition-colors ${
                tab === t.id ? 'border-[#111] text-[#111]' : 'border-transparent text-[#AAA] hover:text-[#111]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'stock' && <StockView />}
        {tab === 'orders' && <OrdersView onOpenSerial={openSerial} />}
        {tab === 'serials' && <SerialsView search={serialSearch} setSearch={setSerialSearch} />}
      </main>
    </div>
  )
}
