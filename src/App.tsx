import { NavLink, Route, Routes } from 'react-router-dom'
import Principal from './pages/Principal'
import Irrigacao from './pages/Irrigacao'
import Mercado from './pages/Mercado'
import Cultivos from './pages/Cultivos'

function App() {
  return (
    <div className="min-h-full flex flex-col font-sans">
      <header className="bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-soft">
        <div className="page-container flex items-center justify-between py-4">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span>AgroT — Gestão Inteligente</span>
          </h1>
          <nav className="flex gap-2">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-white text-brand-700' : 'hover:bg-brand-500/30'}`
              }
            >
              Principal
            </NavLink>
            <NavLink
              to="/cultivos"
              className={({ isActive }) =>
                `px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-white text-brand-700' : 'hover:bg-brand-500/30'}`
              }
            >
              Cultivos
            </NavLink>
            <NavLink
              to="/irrigacao"
              className={({ isActive }) =>
                `px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-white text-brand-700' : 'hover:bg-brand-500/30'}`
              }
            >
              Irrigação
            </NavLink>
            <NavLink
              to="/mercado"
              className={({ isActive }) =>
                `px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-white text-brand-700' : 'hover:bg-brand-500/30'}`
              }
            >
              Mercado
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <div className="page-container">
          <Routes>
            <Route path="/" element={<Principal />} />
            <Route path="/cultivos" element={<Cultivos />} />
            <Route path="/irrigacao" element={<Irrigacao />} />
            <Route path="/mercado" element={<Mercado />} />
          </Routes>
        </div>
      </main>

      <footer className="mt-8 border-t bg-white/60 backdrop-blur">
        <div className="page-container text-sm text-gray-700 flex items-center justify-between py-4">
          <div>
            <div>Área total: 40 ha • Módulos fiscais: 4</div>
            <div className="text-xs">AgroT — Plataforma IoT para agricultura familiar</div>
          </div>
          <div className="text-brand-700 text-lg" title="Campo e natureza">🌱</div>
        </div>
      </footer>
    </div>
  )
}

export default App
