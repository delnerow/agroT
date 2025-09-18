import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  const items = [
    { to: '/', label: 'Principal', icon: '🏡', end: true },
    { to: '/cultivos', label: 'Cultivos', icon: '🌾' },
    { to: '/irrigacao', label: 'Irrigação', icon: '💧' },
    { to: '/mercado', label: 'Mercado', icon: '📈' },
  ] as const

  return (
  <aside className="flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-green-50 border-r border-brand-100">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-brand-100">
        <div className="text-2xl">🌿</div>
        <div className="font-semibold">AgroT</div>
      </div>
      <nav className="p-3 space-y-1 overflow-y-auto">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={(it as any).end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ` +
              (isActive
                ? 'bg-brand-50 text-brand-800 border border-brand-100'
                : 'hover:bg-sky-50 text-gray-700')
            }
          >
            <span className="text-lg" aria-hidden>{it.icon}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-3 text-xs text-gray-500">
      </div>
    </aside>
  )
}
