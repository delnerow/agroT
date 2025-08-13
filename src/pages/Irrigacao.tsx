import { useEffect, useMemo, useState } from 'react'
import { useCultivosStore } from '../stores/cultivos'

type IrrigacaoInfo = {
  umidadeAtual: number // %
  umidadeNecessaria: number // %
  ultimaIrrigacao: string // ISO ou legível
  proximaIrrigacao?: string // quando modo auto
}

export default function Irrigacao() {
  const [modoAuto, setModoAuto] = useState(true)
  const cultivos = useCultivosStore(s => s.cultivos)
  // Mapa de dados por cultivo (mantém valores ao alternar páginas)
  const [dados, setDados] = useState<Record<string, IrrigacaoInfo>>({})

  // Quando cultivos mudarem, garantir entradas no mapa com defaults
  useEffect(() => {
    setDados(prev => {
      const next = { ...prev }
      for (const c of cultivos) {
        if (!next[c.id]) {
          next[c.id] = {
            umidadeAtual: 40,
            umidadeNecessaria: 55,
            ultimaIrrigacao: '—',
            proximaIrrigacao: modoAuto ? 'Hoje 18:00' : undefined,
          }
        }
      }
      // opcional: remover entradas de cultivos deletados
      for (const id of Object.keys(next)) {
        if (!cultivos.find(c => c.id === id)) delete next[id]
      }
      return next
    })
  }, [cultivos, modoAuto])

  const deficit = useMemo(() =>
    Object.fromEntries(cultivos.map(c => {
      const d = dados[c.id]
      const val = d ? Math.max(0, d.umidadeNecessaria - d.umidadeAtual) : 0
      return [c.id, val]
    })), [cultivos, dados]
  )

  function regarAgora(id: string) {
    // Simula rega imediata, aumentando a umidade atual
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
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="card-title"><span className="section-accent" /> Controle de irrigação</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Modo</span>
            <button
              onClick={() => setModoAuto(!modoAuto)}
              className={modoAuto ? 'btn-primary' : 'btn-outline'}
            >{modoAuto ? 'Automático' : 'Manual'}</button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">Quando automático, define a próxima irrigação conforme umidade e previsão de chuva.</p>
      </section>

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
