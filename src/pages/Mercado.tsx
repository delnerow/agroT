import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCultivosStore } from '../stores/cultivos'

// Placeholder para filtros e dados iniciais (CONAB)
const cultivosBase = ['Tomate', 'Milho', 'Café']

type Serie = { label: string; value: number }

const mockProdutos360: Record<string, string[]> = {
  Tomate: ['Boletim Tomate 360 – tendências regionais'],
  Milho: ['Relatório Milho 360 – exportação e estoque'],
}

const mockPrecoMinimo: Record<string, number> = {
  Tomate: 3.2,
  Milho: 1.8,
  Café: 4.1,
}

const mockOferta: Serie[] = [
  { label: 'Jan', value: 100 }, { label: 'Fev', value: 120 }, { label: 'Mar', value: 90 }, { label: 'Abr', value: 130 },
]
const mockDemanda: Serie[] = [
  { label: 'Jan', value: 110 }, { label: 'Fev', value: 115 }, { label: 'Mar', value: 95 }, { label: 'Abr', value: 140 },
]
const mockCustoProducao: Serie[] = [
  { label: '2022', value: 1.6 }, { label: '2023', value: 1.9 }, { label: '2024', value: 2.1 },
]
const mockPrecosEstimados: Serie[] = [
  { label: 'Próx. mês', value: 3.4 }, { label: '2 meses', value: 3.5 },
]

function MiniBars({ data, color = 'bg-green-600' }: { data: Serie[]; color?: string }) {
  const max = useMemo(() => Math.max(...data.map(d => d.value)), [data])
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d) => (
        <div key={d.label} className="text-center">
          <div className={`${color} w-6`} style={{ height: `${(d.value / max) * 100}%` }} />
          <div className="text-[10px] text-gray-500 mt-1">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function Mercado() {
  const cultivosStore = useCultivosStore(s => s.cultivos)
  const [cultivo, setCultivo] = useState(cultivosBase[0])
  const produtos360 = mockProdutos360[cultivo] ?? []
  const precoMinimo = mockPrecoMinimo[cultivo]

  // Placeholder calculadora de frete (CONAB): valor por km e distância
  const [distKm, setDistKm] = useState(120)
  const [valorPorKm, setValorPorKm] = useState(5.2)
  const freteEstimado = (distKm * valorPorKm).toFixed(2)

  // Backend: preços mínimos por cultivos cadastrados
  const cultivosNomes = useMemo(() => cultivosStore.map(c => c.nome).join(','), [cultivosStore])
  const { data: precosMin, isLoading: loadingPrecos, error: errorPrecos } = useQuery({
    queryKey: ['precos-minimos', cultivosNomes],
    queryFn: async () => {
      if (!cultivosNomes) return null
      const res = await fetch(`/api/conab/precos-minimos?cultivos=${encodeURIComponent(cultivosNomes)}`)
      if (!res.ok) throw new Error('Falha ao consultar preços mínimos')
      return res.json() as Promise<{ ok: boolean; cultivos: Record<string, any> }>
    },
    enabled: !!cultivosNomes,
  })

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex items-center gap-3">
          <div className="card-title"><span className="section-accent" /> Cultivo</div>
          <select className="select" value={cultivo} onChange={(e) => setCultivo(e.target.value)}>
            {cultivosBase.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="card-title"><span className="section-accent" /> Preço mínimo (CONAB) — cultivos cadastrados</div>
        {!cultivosNomes && (
          <div className="text-sm text-gray-500">Cadastre seus cultivos na aba “Cultivos” para consultar preços mínimos.</div>
        )}
        {cultivosNomes && (
          <div>
            {loadingPrecos && <div className="text-sm text-gray-500">Carregando preços mínimos...</div>}
            {errorPrecos && <div className="text-sm text-red-600">Falha ao consultar preços mínimos.</div>}
            {precosMin?.ok && (
              <div className="grid md:grid-cols-3 gap-3">
                {Object.entries(precosMin.cultivos).map(([nome, info]) => (
                  <div key={nome} className="border rounded-lg p-3">
                    <div className="font-medium">{nome}</div>
                    <div className="text-sm text-gray-500">Fonte: <span className="badge">CONAB</span></div>
                    <div className="mt-1 text-2xl font-semibold">
                      {info?.precoMinimo != null ? `R$ ${Number(info.precoMinimo).toFixed(2)}` : '—'}
                    </div>
                    {info?.linha?.length ? (
                      <div className="mt-1 text-xs text-gray-600 truncate" title={info.linha.join(' | ')}>
                        {info.linha.join(' | ')}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="card space-y-3">
          <div className="card-title"><span className="section-accent" /> Produtos 360</div>
          {produtos360.length ? (
            <ul className="list-disc pl-5 text-sm">
              {produtos360.map((p) => <li key={p}>{p}</li>)}
            </ul>
          ) : (
            <div className="text-sm text-gray-500">Sem itens disponíveis para este cultivo.</div>
          )}
        </div>
        <div className="card space-y-3">
          <div className="card-title"><span className="section-accent" /> Preço mínimo (R$/kg)</div>
          <div className="text-3xl font-bold">{precoMinimo?.toFixed(2) ?? '—'}</div>
        </div>
        <div className="card space-y-3">
          <div className="card-title"><span className="section-accent" /> Custo de produção (série)</div>
          <MiniBars data={mockCustoProducao} color="bg-amber-600" />
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="card space-y-3">
          <div className="card-title"><span className="section-accent" /> Oferta vs Demanda</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Oferta</div>
              <MiniBars data={mockOferta} color="bg-blue-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Demanda</div>
              <MiniBars data={mockDemanda} color="bg-rose-600" />
            </div>
          </div>
        </div>
        <div className="card space-y-3">
          <div className="card-title"><span className="section-accent" /> Preços estimados</div>
          <MiniBars data={mockPrecosEstimados} color="bg-emerald-600" />
        </div>
      </section>

      <section className="card space-y-3">
        <div className="card-title"><span className="section-accent" /> Calculadora de frete (placeholder CONAB)</div>
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <label className="text-sm">Distância (km)
            <input type="number" className="mt-1 input" value={distKm} onChange={e => setDistKm(Number(e.target.value))} />
          </label>
          <label className="text-sm">Valor por km (R$)
            <input type="number" className="mt-1 input" step="0.1" value={valorPorKm} onChange={e => setValorPorKm(Number(e.target.value))} />
          </label>
          <div className="text-sm">Custo estimado: <span className="text-lg font-semibold">R$ {freteEstimado}</span></div>
        </div>
        <p className="text-xs text-gray-500">Integração futura: leitura de tabelas/planilhas do portal CONAB para valores por rota e tipo de produto.</p>
      </section>

      <p className="text-xs text-gray-500">Dados exibidos são simulados. Integrações com OpenWeather/INMET e CONAB virão com chaves em variáveis VITE_*.</p>
    </div>
  )
}
