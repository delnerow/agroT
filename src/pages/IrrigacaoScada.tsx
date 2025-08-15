import { useEffect, useMemo, useState } from 'react'
import { useCultivosStore } from '../stores/cultivos'
import { calcularUmidadeIdeal } from '../utils/umidade'

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
            umidadeAtual: 0, // será atualizado pelo ScadaBR
            umidadeNecessaria: calcularUmidadeIdeal(c.tipoPlanta, c.estagioAtual, c.tipoSolo),
            ultimaIrrigacao: '—',
            proximaIrrigacao: modoAuto ? '—' : undefined,
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

  // Busca dados do ScadaBR a cada minuto
  useEffect(() => {
    async function fetchDadosScada() {
      try {
        const res = await fetch('/api/scadabr')
        const scadaData = await res.json()
        setDados(prev => {
          const next = { ...prev }
          for (const c of cultivos) {
            if (next[c.id] && scadaData[c.id]) {
              next[c.id].umidadeAtual = scadaData[c.id].umidadeAtual
              next[c.id].ultimaIrrigacao = scadaData[c.id].ultimaIrrigacao
            }
          }
          return next
        })
      } catch (err) {
        console.error('Erro ao buscar dados do ScadaBR', err)
      }
    }

    fetchDadosScada()
    const interval = setInterval(fetchDadosScada, 60000)
    return () => clearInterval(interval)
  }, [cultivos])

  // Calcula déficit de umidade
  const deficit = useMemo(() =>
    Object.fromEntries(cultivos.map(c => {
      const d = dados[c.id]
      const val = d ? Math.max(0, d.umidadeNecessaria - d.umidadeAtual) : 0
      return [c.id, val]
    })), [cultivos, dados]
  )

  // Função para regar um cultivo, enviando comando para ScadaBR
  async function regarAgora(id: string) {
    try {
      await fetch('/api/scadabr/regar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cultivoId: id, metodo: metodoGlobal })
      })
      setDados(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          ultimaIrrigacao: 'Agora',
          umidadeAtual: Math.min(100, prev[id].umidadeAtual + 8)
        }
      }))
    } catch (err) {
      console.error('Erro ao acionar irrigação', err)
    }
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
                  <div className="font-medium">{c.nome}</div>
                  <div className="text-sm">Umidade atual: <span className="font-semibold">{d?.umidadeAtual ?? '—'}%</span></div>
                  <div className="text-sm">Umidade necessária: <span className="font-semibold">{d?.umidadeNecessaria ?? '—'}%</span></div>
                  <div className="text-xs text-gray-600">Déficit: {deficit[c.id]}%</div>
                  <div className="text-xs text-gray-500">Última irrigação: {d?.ultimaIrrigacao ?? '—'}</div>
                  {modoAuto && (
                    <div className="text-xs text-gray-500">Próxima (prevista): {d?.proximaIrrigacao ?? '—'}</div>
                  )}
                  <div className="text-xs text-gray-500">Método: {d?.metodo}</div>
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
