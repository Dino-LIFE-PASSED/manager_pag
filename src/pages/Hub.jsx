const TOOLS = [
  {
    id: 'approve-serials',
    label: 'Approve Inventory',
    description: 'ตรวจสอบ serial number ที่รับเข้ามาว่าตรงกับยอดสั่ง แล้ว approve เพื่อบันทึกลง stock',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'stock-trace',
    label: 'Stock & Trace',
    description: 'ตรวจสต๊อกเทียบกับ serial และดูว่าแต่ละ Order ส่ง serial ตัวไหนไปให้ใคร',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'direct-order',
    label: 'Direct Order',
    description: 'สินค้าที่สั่งมาแล้วส่งให้ Dealer ทันที — สร้าง Order, Invoice และผูก S/N โดยไม่ผ่านคลัง',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    id: 'line-settings',
    label: 'LINE Alert',
    description: 'ตั้งค่าและทดสอบการแจ้งเตือน LINE ให้ Staff เมื่อมี Order ใหม่เข้ามา',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
]

export default function Hub({ auth, onLogout, onNavigate }) {
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

      <header className="relative z-20 sticky top-0 bg-[#F8F8F8] border-b border-[#E2E2E0] px-4 md:px-10 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src="/PAG Logo.png" alt="PAG" className="h-8 md:h-10 w-auto" />
          <div className="hidden sm:block w-px h-6 bg-[#E2E2E0]" />
          <span className="hidden sm:block text-[10px] font-bold tracking-[0.2em] text-[#888] uppercase">Manager Portal</span>
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
          <p className="text-[10px] font-semibold tracking-[0.2em] text-[#888] uppercase mb-2">Manager Portal</p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#111] tracking-tight leading-none">
            Manager Hub<span className="text-[#D41414]">.</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#E2E2E0]">
          {TOOLS.map(tool => (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.id)}
              className="group bg-white p-8 text-left flex flex-col gap-5 hover:bg-[#111] transition-colors duration-200"
            >
              <div className="text-[#888] group-hover:text-[#555]">
                {tool.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#111] text-lg leading-snug group-hover:text-white transition-colors">
                  {tool.label}
                </p>
                <p className="text-sm text-[#888] mt-1.5 leading-relaxed group-hover:text-[#AAA] transition-colors">
                  {tool.description}
                </p>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#CCC] group-hover:text-[#666] transition-colors">
                Open
                <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>
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
