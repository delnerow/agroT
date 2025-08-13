import { NavLink } from 'react-router-dom'

export default function Topbar() {
  return (
    <header className="h-14 bg-white/90 backdrop-blur border-b border-brand-100 sticky top-0 z-10">
      <div className="px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="hidden md:block text-sm text-gray-500">AgroT — Gestão Inteligente</div>
        </div>
        <nav className="flex gap-1 text-sm">
          <NavLink to="/" end className={({ isActive }) => `px-3 py-1.5 rounded-lg ${isActive ? 'bg-brand-50 text-brand-800' : 'hover:bg-sky-50 text-gray-700'}`}>Principal</NavLink>
          <NavLink to="/cultivos" className={({ isActive }) => `px-3 py-1.5 rounded-lg ${isActive ? 'bg-brand-50 text-brand-800' : 'hover:bg-sky-50 text-gray-700'}`}>Cultivos</NavLink>
          <NavLink to="/irrigacao" className={({ isActive }) => `px-3 py-1.5 rounded-lg ${isActive ? 'bg-brand-50 text-brand-800' : 'hover:bg-sky-50 text-gray-700'}`}>Irrigação</NavLink>
          <NavLink to="/mercado" className={({ isActive }) => `px-3 py-1.5 rounded-lg ${isActive ? 'bg-brand-50 text-brand-800' : 'hover:bg-sky-50 text-gray-700'}`}>Mercado</NavLink>
        </nav>
      </div>
    </header>
  )
}
