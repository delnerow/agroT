  // Mapeamento de ícones para cada cultivo
  const cultivoIcons: Record<string, string> = {
    "Feijão Preto": "🌱",
    "Feijão Cores": "🌱",
    "Arroz": "🌾",
    "Mandioca": "🥔",
    "Milho": "🌽",
    "Cafe": "☕",
    "Trigo": "🌾",
    "Banana": "🍌",
    "Abacaxi": "🍍"
  }
import { useEffect, useMemo, useState } from 'react'
import { useCultivosStore, getIdealHumidity } from '../stores/cultivos'
import { HumidityPlotModal } from '../components/HumidityPlotModal'
import type { Plant } from '../stores/cultivos'

type IrrigacaoInfo = {
  umidadeAtual: number
  umidadeNecessaria: number
  ultimaIrrigacao: string
  proximaIrrigacao?: string
  metodo: 'Aspersão' | 'Gotejamento' | 'Microaspersão'
}

export default function Irrigacao() {
  const [modoAuto, setModoAuto] = useState(true)
  const [metodoGlobal, setMetodoGlobal] = useState<IrrigacaoInfo['metodo']>('Aspersão')
  const { plants, addSensorData } = useCultivosStore()
  const [dados, setDados] = useState<Record<string, IrrigacaoInfo>>({})
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [hoveredPlantId, setHoveredPlantId] = useState<string | null>(null)

  // Inicializa os dados de irrigação para cada planta
  useEffect(() => {
    setDados(prev => {
      const next = { ...prev }
      for (const c of plants) {
        if (!next[c.id]) {
          next[c.id] = {
            umidadeAtual: 40,
            umidadeNecessaria: getIdealHumidity(c.tipoPlanta, c.estagioAtual),
            ultimaIrrigacao: '—',
            proximaIrrigacao: modoAuto ? 'Hoje 18:00' : undefined,
            metodo: metodoGlobal,
          }
        }
      }
      // Remove plants deleted
      for (const id of Object.keys(next)) {
        if (!plants.find((p) => p.id === id)) delete next[id]
      }
      return next
    })
  }, [plants, modoAuto, metodoGlobal])

  // Calculate humidity deficit per plant
  const deficit = useMemo(() =>
    Object.fromEntries(plants.map((p) => {
      const d = dados[p.id]
      const val = d ? Math.max(0, d.umidadeNecessaria - d.umidadeAtual) : 0
      return [p.id, val]
    })), [plants, dados]
  )

  async function regarAgora(id: string) {
    const cur = dados[id]
    if (!cur) return

    const newUmidade = Math.min(100, cur.umidadeAtual + 8)
    
    // Update sensor data in database
    await addSensorData(id, 25 /* default temp */, newUmidade)

    setDados(prev => ({
      ...prev,
      [id]: {
        ...cur,
        umidadeAtual: newUmidade,
        ultimaIrrigacao: 'Agora',
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Seção de modo e método */}
      <section className="card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Modo:</span>
          <button
            onClick={() => setModoAuto(!modoAuto)}
            className={`px-3 py-1 rounded-full font-medium text-sm border ${
              modoAuto ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-700 border-gray-300'
            }`}
          >
            {modoAuto ? 'Automático' : 'Manual'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Método:</span>
          {(['Aspersão','Gotejamento','Microaspersão'] as IrrigacaoInfo['metodo'][]).map(m => (
            <button
              key={m}
              onClick={() => setMetodoGlobal(m)}
              className={`px-3 py-1 rounded-full font-medium text-sm border ${
                metodoGlobal === m ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {/* Seção de cultivos */}
      <section className="card">
        <h3 className="card-title mb-3"><span className="section-accent" /> Cultivos</h3>
        {!plants.length ? (
          <div className="text-sm text-gray-500">Cadastre seus cultivos na aba "Cultivos" para controlar a irrigação.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {plants.map((p) => {
              const d = dados[p.id]
              return (
                <div 
                  key={p.id} 
                  className={`border rounded-lg p-3 space-y-2 transition-all cursor-pointer ${
                    hoveredPlantId === p.id ? 'shadow-lg transform scale-[1.02] border-blue-500' : ''
                  }`}
                  onMouseEnter={() => setHoveredPlantId(p.id)}
                  onMouseLeave={() => setHoveredPlantId(null)}
                  onClick={() => setSelectedPlant(p)}
                >
                  <div className="font-medium flex items-center gap-2">
                    <span>{cultivoIcons[p.nome] || "🌱"}</span>
                    {p.nome}
                  </div>
                  <div className="text-sm">Umidade atual: <span className={`font-semibold px-1 rounded ${d ? (d.umidadeAtual < d.umidadeNecessaria ? 'bg-red-200' : d.umidadeAtual > d.umidadeNecessaria ? 'bg-purple-200' : '') : ''}`}>{d?.umidadeAtual ?? '—'}%</span></div>
                  <div className="text-sm">Umidade necessária: <span className="font-semibold">{d?.umidadeNecessaria ?? '—'}%</span></div>
                  <div className="text-xs text-gray-600">Déficit: {deficit[p.id]}%</div>
                  <div className="text-xs text-gray-500">Última irrigação: {d?.ultimaIrrigacao ?? '—'}</div>
                  {modoAuto ? (
                    <div className="text-xs text-gray-500">Próxima (prevista): {d?.proximaIrrigacao ?? '—'}</div>
                  ) : null}
                  <div className="pt-2">
                    <button
                      className={`w-full ${modoAuto ? 'btn text-gray-500 cursor-not-allowed bg-gray-100' : 'btn-primary'}`}
                      disabled={modoAuto}
                      onClick={() => regarAgora(p.id)}
                    >Regar agora</button>
                  </div>
                </div>
              )
            })}
                    </div>
        )}
      </section>

      {/* Humidity Plot Modal */}
      <HumidityPlotModal
        plant={selectedPlant}
        onClose={() => setSelectedPlant(null)}
      />
```
    </div>
  )
}
