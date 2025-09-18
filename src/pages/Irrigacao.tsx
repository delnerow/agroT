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
import { useCultivosStore } from '../stores/cultivos'
import { calcularUmidadeIdeal } from '../utils/umidade' // função que calcula % baseado em planta, estágio e solo

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
  const cultivos = useCultivosStore(s => s.cultivos)
  const [dados, setDados] = useState<Record<string, IrrigacaoInfo>>({})

  // Inicializa os dados de irrigação para cada cultivo
  useEffect(() => {
    setDados(prev => {
      const next = { ...prev }
      for (const c of cultivos) {
        if (!next[c.id]) {
          next[c.id] = {
            umidadeAtual: 40,
            umidadeNecessaria: calcularUmidadeIdeal(c.tipoPlanta, c.estagioAtual, c.tipoSolo),
            ultimaIrrigacao: '—',
            proximaIrrigacao: modoAuto ? 'Hoje 18:00' : undefined,
            metodo: metodoGlobal,
          }
        }
      }
      // Remove cultivos deletados
      for (const id of Object.keys(next)) {
        if (!cultivos.find(c => c.id === id)) delete next[id]
      }
      return next
    })
  }, [cultivos, modoAuto, metodoGlobal])

  // Calcula déficit de umidade por cultivo
  const deficit = useMemo(() =>
    Object.fromEntries(cultivos.map(c => {
      const d = dados[c.id]
      const val = d ? Math.max(0, d.umidadeNecessaria - d.umidadeAtual) : 0
      return [c.id, val]
    })), [cultivos, dados]
  )

  function regarAgora(id: string) {
    setDados(prev => {
      const cur = prev[id]
      if (!cur) return prev
      return {
        ...prev,
        [id]: {
          ...cur,
          umidadeAtual: Math.min(100, cur.umidadeAtual + 8),
          ultimaIrrigacao: 'Agora',
        },
      }
    })
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
        {!cultivos.length ? (
          <div className="text-sm text-gray-500">Cadastre seus cultivos na aba “Cultivos” para controlar a irrigação.</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {cultivos.map(c => {
              const d = dados[c.id]
              return (
                <div key={c.id} className="border rounded-lg p-3 space-y-2">
                  <div className="font-medium flex items-center gap-2">
                    <span>{cultivoIcons[c.nome] || "🌱"}</span>
                    {c.nome}
                  </div>
                  <div className="text-sm">Umidade atual: <span className={`font-semibold px-1 rounded ${d ? (d.umidadeAtual < d.umidadeNecessaria ? 'bg-red-200' : d.umidadeAtual > d.umidadeNecessaria ? 'bg-purple-200' : '') : ''}`}>{d?.umidadeAtual ?? '—'}%</span></div>
                  <div className="text-sm">Umidade necessária: <span className="font-semibold">{d?.umidadeNecessaria ?? '—'}%</span></div>
                  <div className="text-xs text-gray-600">Déficit: {deficit[c.id]}%</div>
                  <div className="text-xs text-gray-500">Última irrigação: {d?.ultimaIrrigacao ?? '—'}</div>
                  {modoAuto ? (
                    <div className="text-xs text-gray-500">Próxima (prevista): {d?.proximaIrrigacao ?? '—'}</div>
                  ) : null}
                  <div className="pt-2">
                    <button
                      className={`w-full ${modoAuto ? 'btn text-gray-500 cursor-not-allowed bg-gray-100' : 'btn-primary'}`}
                      disabled={modoAuto}
                      onClick={() => regarAgora(c.id)}
                    >Regar agora</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
