import { Route, Routes } from 'react-router-dom'
import Principal from './pages/Principal'
import Irrigacao from './pages/Irrigacao'
import Mercado from './pages/Mercado'
import Cultivos from './pages/Cultivos'
import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'

function App() {
  return (
    <div className="min-h-full flex font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
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
      </div>
    </div>
  )
}

export default App
