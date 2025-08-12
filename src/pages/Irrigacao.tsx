import { useMemo, useState } from 'react'

interface Cultivo {
  id: string
  nome: string
  umidadeAtual: number // %
  umidadeNecessaria: number // %
  ultimaIrrigacao: string // ISO ou legível
  proximaIrrigacao?: string // quando modo auto
}

const mockCultivos: Cultivo[] = [
  { id: 'tomate', nome: 'Tomate', umidadeAtual: 42, umidadeNecessaria: 55, ultimaIrrigacao: 'Hoje 06:30', proximaIrrigacao: 'Hoje 18:00' },
  { id: 'milho', nome: 'Milho', umidadeAtual: 38, umidadeNecessaria: 50, ultimaIrrigacao: 'Ontem 19:10', proximaIrrigacao: 'Hoje 17:30' },
  { id: 'feijao', nome: 'Feijão', umidadeAtual: 47, umidadeNecessaria: 60, ultimaIrrigacao: 'Hoje 05:55', proximaIrrigacao: 'Hoje 19:10' },
]

export default function Irrigacao() {
  const [modoAuto, setModoAuto] = useState(true)
  const [cultivos, setCultivos] = useState<Cultivo[]>(mockCultivos)

  const deficit = useMemo(() =>
    Object.fromEntries(cultivos.map(c => [c.id, Math.max(0, c.umidadeNecessaria - c.umidadeAtual)])), [cultivos]
  )

  function regarAgora(id: string) {
    // Simula rega imediata, aumentando a umidade atual
    setCultivos(prev => prev.map(c => c.id === id ? ({
      ...c,
      umidadeAtual: Math.min(100, c.umidadeAtual + 8),
      ultimaIrrigacao: 'Agora',
    }) : c))
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
        <div className="grid md:grid-cols-3 gap-4">
          {cultivos.map(c => (
            <div key={c.id} className="border rounded-lg p-3 space-y-2">
              <div className="font-medium">{c.nome}</div>
              <div className="text-sm">Umidade atual: <span className="font-semibold">{c.umidadeAtual}%</span></div>
              <div className="text-sm">Umidade necessária: <span className="font-semibold">{c.umidadeNecessaria}%</span></div>
              <div className="text-xs text-gray-600">Déficit: {deficit[c.id]}%</div>
              <div className="text-xs text-gray-500">Última irrigação: {c.ultimaIrrigacao}</div>
              {modoAuto ? (
                <div className="text-xs text-gray-500">Próxima (prevista): {c.proximaIrrigacao ?? '—'}</div>
              ) : null}
              <div className="pt-2">
                <button
                  className={`w-full ${modoAuto ? 'btn text-gray-500 cursor-not-allowed bg-gray-100' : 'btn-primary'}`}
                  disabled={modoAuto}
                  onClick={() => regarAgora(c.id)}
                >Regar agora</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
