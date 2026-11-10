import { useState, useEffect } from 'react'
import { apiFetch, getToken } from '../lib/apiFetch.js'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

let nextId = 1

function fmt(n) {
  return Number(n || 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

// One S/N per line — barcode scanners send Enter after each scan, so this works with a scanner too
function parseSerials(text) {
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}

function ProductPicker({ products, value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const selected = products.find(p => p.id === value)
  const q = search.trim().toLowerCase()
  const filtered = q ? products.filter(p => (p.name ?? '').toLowerCase().includes(q)) : products

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#111] truncate">{selected.name}</p>
          <p className="text-[10px] text-[#AAA] uppercase tracking-wider mt-0.5">{selected.category}</p>
        </div>
        <button
          onClick={() => { onChange(null); setSearch('') }}
          className="shrink-0 text-[10px] font-bold tracking-widest uppercase text-[#AAA] hover:text-[#D41414] underline underline-offset-4 transition-colors"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border-b border-[#E2E2E0] focus-within:border-[#111] transition-colors pb-1">
        <svg className="w-3.5 h-3.5 text-[#CCC] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search product..."
          className="flex-1 py-1.5 bg-transparent text-[#111] placeholder:text-[#CCC] focus:outline-none text-base"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E2E2E0] shadow-xl z-20 max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#AAA]">{products.length === 0 ? 'โหลดรายการสินค้าไม่ได้' : 'ไม่พบสินค้า'}</p>
          ) : filtered.map(p => (
            <button
              key={p.id}
              onMouseDown={() => { onChange(p); setSearch(''); setOpen(false) }}
              className="w-full px-4 py-3 text-left hover:bg-[#F8F8F8] border-b border-[#F4F4F4] last:border-0 transition-colors"
            >
              <p className="text-sm font-medium text-[#111] truncate">{p.name}</p>
              <p className="text-[10px] text-[#AAA] uppercase tracking-wider mt-0.5">
                {p.category}{p.discontinue ? ' · discontinued' : ''} · Dealer ฿{fmt(p.dealer_price)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DirectOrder({ auth, onLogout, onBack }) {
  const [dealers, setDealers] = useState([])
  const [products, setProducts] = useState([])
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)

  const [dealerId, setDealerId] = useState('')
  const [items, setItems] = useState([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    async function load(path) {
      const res = await apiFetch(path)
      const data = await res.json().catch(() => null)
      if (!res.ok || !Array.isArray(data)) throw new Error(data?.error ?? `โหลดข้อมูลไม่สำเร็จ (${res.status})`)
      return data
    }
    Promise.all([load('/api/users'), load('/api/products')])
      .then(([users, prods]) => {
        setDealers(users
          .filter(u => u.is_active)
          // Anonymous walk-in account first — it is the most common pick for direct sales
          .sort((a, b) => (b.username === 'walk_in_customer') - (a.username === 'walk_in_customer') ||
            (a.company_name || a.name).localeCompare(b.company_name || b.name)))
        setProducts(prods)
      })
      .catch(err => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function addItem() {
    setItems(prev => [...prev, { id: nextId++, product: null, price: '', serialText: '' }])
  }

  function updateItem(id, patch) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const rows = items.map(i => {
    const serials = parseSerials(i.serialText)
    const price = Number(i.price)
    return { ...i, serials, qty: serials.length, subtotal: (Number.isFinite(price) ? price : 0) * serials.length }
  })
  const total = rows.reduce((s, r) => s + r.subtotal, 0)
  const dealer = dealers.find(d => d.id === dealerId)
  const canSubmit = dealer && rows.length > 0 &&
    rows.every(r => r.product && r.qty > 0 && r.price !== '' && Number(r.price) >= 0)

  async function handleSubmit() {
    if (!canSubmit) return
    const summary = rows.map(r => `• ${r.product.name} × ${r.qty} @ ฿${fmt(r.price)}`).join('\n')
    if (!window.confirm(`สร้าง Order ส่งตรงให้ ${dealer.company_name || dealer.name}?\n\n${summary}\n\nรวม ฿${fmt(total)}`)) return

    setSubmitting(true)
    setError('')
    try {
      const res = await apiFetch('/api/stock/direct-order', {
        method: 'POST',
        body: JSON.stringify({
          user_id: dealerId,
          note,
          items: rows.map(r => ({ product_id: r.product.id, price: Number(r.price), serials: r.serials })),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? `สร้าง Order ไม่สำเร็จ (${res.status})`)
      setResult({ ...data, dealerName: dealer.company_name || dealer.name })
      setItems([])
      setNote('')
      setDealerId('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <header className="sticky top-0 z-30 bg-[#F8F8F8] border-b border-[#E2E2E0] px-4 md:px-10 py-3 flex items-center justify-between">
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
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888] uppercase mb-2">Orders</p>
          <h1 className="text-3xl font-bold text-[#111] tracking-tight leading-none">
            Direct Order<span className="text-[#D41414]">.</span>
          </h1>
          <p className="text-sm text-[#888] mt-3">สินค้าที่สั่งมาแล้วส่งให้ Dealer ทันที ไม่ผ่านคลัง — สร้าง Order, Invoice และผูก S/N ให้ครบ</p>
        </div>

        {result && (
          <div className="bg-white border border-[#E2E2E0] p-6 mb-6">
            <p className="text-[10px] font-bold tracking-widest uppercase text-green-700 mb-3">Order Created · Shipped</p>
            <p className="font-bold text-[#111] text-xl font-mono">{result.invoice_number}</p>
            <p className="text-sm text-[#888] mt-1">{result.dealerName} · ฿{fmt(result.total_amount)}</p>
            <div className="flex flex-wrap gap-5 mt-5">
              <a
                href={`${API_BASE}/api/orders/${result.order_id}/invoice?token=${encodeURIComponent(getToken() ?? '')}`}
                className="text-xs font-semibold tracking-widest uppercase text-[#111] underline underline-offset-4"
              >
                Download Invoice
              </a>
              <button
                onClick={() => setResult(null)}
                className="text-xs font-semibold tracking-widest uppercase text-[#888] hover:text-[#111] underline underline-offset-4"
              >
                New Order
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-5 h-5 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : loadError ? (
          <p className="text-sm text-[#D41414] px-1">{loadError}</p>
        ) : !result && (
          <div className="flex flex-col gap-3">
            {/* Dealer */}
            <div className="bg-white border border-[#E2E2E0] p-5">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-2">Dealer</p>
              <div className="overflow-hidden border-b border-[#E2E2E0] focus-within:border-[#111] transition-colors">
                <select
                  value={dealerId}
                  onChange={e => setDealerId(e.target.value)}
                  className="w-full py-2 bg-transparent text-[#111] text-base focus:outline-none"
                >
                  <option value="">— เลือกผู้ซื้อ —</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.company_name ? `${d.company_name} (${d.name})` : d.name} · {d.role ?? 'dealer'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items */}
            {rows.map((r, idx) => (
              <div key={r.id} className="bg-white border border-[#E2E2E0] p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest text-[#BBB] uppercase">#{idx + 1}</span>
                  <button
                    onClick={() => removeItem(r.id)}
                    className="w-7 h-7 flex items-center justify-center text-[#CCC] hover:text-[#D41414] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <ProductPicker
                  products={products}
                  value={r.product?.id}
                  onChange={p => updateItem(r.id, { product: p, price: p ? String(p.dealer_price ?? '') : '' })}
                />

                {r.product && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1">ราคาต่อชิ้น (รวม VAT)</p>
                      <div className="flex items-center gap-2 border-b border-[#E2E2E0] focus-within:border-[#111] transition-colors">
                        <span className="text-sm text-[#AAA]">฿</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          value={r.price}
                          onChange={e => updateItem(r.id, { price: e.target.value })}
                          className="flex-1 py-1.5 bg-transparent text-[#111] text-base focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1">S/N — 1 บรรทัดต่อ 1 เครื่อง</p>
                      <textarea
                        value={r.serialText}
                        onChange={e => updateItem(r.id, { serialText: e.target.value })}
                        rows={Math.max(3, r.qty + 1)}
                        placeholder={'24307016\n24307017'}
                        className="w-full p-3 border border-[#E2E2E0] focus:border-[#111] focus:outline-none font-mono text-base text-[#111] placeholder:text-[#DDD] resize-y"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#888]">{r.qty} เครื่อง</span>
                      <span className="font-bold text-[#111]">฿{fmt(r.subtotal)}</span>
                    </div>
                  </>
                )}
              </div>
            ))}

            <button
              onClick={addItem}
              className="w-full border-2 border-dashed border-[#E2E2E0] py-5 flex items-center justify-center gap-2 text-[#BBB] hover:border-[#111] hover:text-[#111] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-semibold tracking-widest uppercase">Add Item</span>
            </button>

            {/* Note */}
            <div className="bg-white border border-[#E2E2E0] p-5">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-2">Note (ไม่บังคับ)</p>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full py-1.5 border-b border-[#E2E2E0] focus:border-[#111] bg-transparent text-[#111] text-base focus:outline-none"
              />
            </div>

            {rows.length > 0 && (
              <div className="flex items-center justify-between px-1 pt-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#888]">Total</span>
                <span className="text-2xl font-bold text-[#111]">฿{fmt(total)}</span>
              </div>
            )}

            {error && <p className="text-sm text-[#D41414] px-1">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full bg-[#111] text-white font-semibold tracking-widest uppercase text-xs py-4 hover:bg-[#D41414] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Order & Mark Shipped'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
