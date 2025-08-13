import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCultivosStore } from '../stores/cultivos'

// Os cultivos agora vêm da aba "Cultivos" via Zustand store

type Serie = { label: string; value: number }

// Removidos mocks de produtos/preço mínimo; dados reais virão do backend

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
  const fazenda = useCultivosStore(s => s.fazenda)
  const cultivoNames = useMemo(() => cultivosStore.map(c => c.nome).filter(Boolean), [cultivosStore])
  const [cultivo, setCultivo] = useState<string>('')
  // Seleciona automaticamente o primeiro cultivo cadastrado
  useEffect(() => {
    if (!cultivoNames.length) {
      setCultivo('')
      return
    }
    if (!cultivo || !cultivoNames.includes(cultivo)) {
      setCultivo(cultivoNames[0])
    }
  }, [cultivoNames])
  // Data para consulta da Conjuntura (default: segunda-feira da última semana completa)
  function lastFullWeekMondayISO() {
    const now = new Date()
    // JS: 0=Dom,1=Seg,... 6=Sáb. Queremos a segunda da semana atual
    const day = now.getDay()
    const diffToMonday = (day + 6) % 7 // quantos dias voltar até segunda
    const thisWeekMonday = new Date(now)
    thisWeekMonday.setHours(0,0,0,0)
    thisWeekMonday.setDate(now.getDate() - diffToMonday)
    const lastWeekMonday = new Date(thisWeekMonday)
    lastWeekMonday.setDate(thisWeekMonday.getDate() - 7)
    const y = lastWeekMonday.getFullYear()
    const m = String(lastWeekMonday.getMonth() + 1).padStart(2, '0')
    const d = String(lastWeekMonday.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const [dataConj, setDataConj] = useState<string>(lastFullWeekMondayISO())

  // Placeholder calculadora de frete (CONAB): valor por km e distância
  const [distKm, setDistKm] = useState(120)
  const [valorPorKm, setValorPorKm] = useState(5.2)
  const freteEstimado = (distKm * valorPorKm).toFixed(2)

  // Backend: preços mínimos por cultivos cadastrados
  const cultivosNomes = useMemo(() => cultivoNames.join(','), [cultivoNames])
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

  // CONAB Produtos 360: Conjuntura
  const { data: conjResp, isLoading: loadingConj, error: errorConj } = useQuery({
    queryKey: ['conjuntura', cultivo, dataConj],
    queryFn: async () => {
      const res = await fetch(`/api/conab/produtos360/conjuntura?produto=${encodeURIComponent(cultivo.toUpperCase())}&data=${encodeURIComponent(dataConj)}`)
      if (!res.ok) throw new Error('Falha ao consultar conjuntura')
      return res.json() as Promise<{ ok: boolean; data: { metadata?: any[]; resultset?: any[] } }>
    },
    enabled: !!cultivo,
  })

  // CONAB Produtos 360: Preços (tabela Estado, P. Médio, P. Mínimo, etc.)
  const { data: precosResp, isLoading: loadingTabela, error: errorTabela } = useQuery({
    queryKey: ['precos-tabela', cultivo],
    queryFn: async () => {
      const res = await fetch(`/api/conab/produtos360/precos?produto=${encodeURIComponent(cultivo.toUpperCase())}`)
      if (!res.ok) throw new Error('Falha ao consultar preços (tabela)')
      return res.json() as Promise<{ ok: boolean; data: { metadata?: any[]; resultset?: any[] } }>
    },
    enabled: !!cultivo,
  })

  function renderCdaTable(data?: { metadata?: any[]; resultset?: any[] }, uf?: string) {
    const headers = data?.metadata?.map(m => m.colName) || [];
    const ufIndex = headers.findIndex(h => h === 'UF');

    const filteredRows = ufIndex !== -1 && uf
      ? data?.resultset?.filter(row => row[ufIndex] === uf)
      : data?.resultset;

    if (!filteredRows || filteredRows.length === 0) {
      const message = uf ? `Nenhuma cotação encontrada para a UF "${uf}".` : 'Nenhuma tabela de preços encontrada.';
      return <div className="text-sm text-gray-500 p-4 text-center">{message}</div>;
    }

    const formatCell = (cell: any, header: string) => {
      if (typeof cell === 'number') {
        const fixedValue = cell.toFixed(2);
        if (header === 'DifPercentual') {
          if (cell > 0) return <span className="flex items-center gap-1 text-green-600 font-semibold">▲ {fixedValue}%</span>;
          if (cell < 0) return <span className="flex items-center gap-1 text-red-600 font-semibold">▼ {Math.abs(cell).toFixed(2)}%</span>;
          return <span>{fixedValue}%</span>;
        }
        return fixedValue;
      }
      return cell;
    };

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-sm text-left text-gray-800">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider">
            <tr>
              {headers.map((h, i) => <th key={i} className="px-4 py-3 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRows.map((row, i) => (
              <tr key={i} className="hover:bg-sky-50/50">
                {row.map((cell: any, j: number) => (
                  <td key={j} className="px-4 py-3 whitespace-nowrap">
                    {formatCell(cell, headers[j])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <div className="flex items-center gap-3">
            <div className="card-title"><span className="section-accent" /> Cultivo</div>
            <select className="select" value={cultivo} onChange={(e) => setCultivo(e.target.value)} disabled={!cultivoNames.length}>
              {cultivoNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <label className="text-sm">Data da conjuntura
            <input type="date" className="mt-1 input" value={dataConj} onChange={(e) => setDataConj(e.target.value)} />
            <div className="mt-1 text-xs text-gray-500">Sugestão: use a segunda-feira da última semana completa (atualiza às sextas).</div>
          </label>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="card-title"><span className="section-accent" /> Conjuntura</div>
        {loadingConj && <div className="text-sm text-gray-500">Carregando conjuntura...</div>}
        {errorConj && <div className="text-sm text-red-600">Falha ao consultar conjuntura.</div>}
        {conjResp?.data && (
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {conjResp.data.resultset?.[0]?.[1] || 'Nenhum comentário de analista encontrado.'}
          </div>
        )}
      </section>

      <section className="card space-y-3">
        <div className="card-title"><span className="section-accent" /> Preço Mínimo x Preço Recebido</div>
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
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">Tabela (Estado, P. Médio Semanal, P. Mínimo, etc.)</div>
          {loadingTabela && <div className="text-sm text-gray-500">Carregando tabela...</div>}
          {errorTabela && <div className="text-sm text-red-600">Falha ao consultar tabela de preços.</div>}
          {!loadingTabela && !errorTabela && renderCdaTable(precosResp?.data, fazenda.uf)}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="card space-y-3">
          <div className="card-title"><span className="section-accent" /> Produtos 360</div>
          <div className="text-sm text-gray-500">Integrações de relatórios serão exibidas aqui.</div>
        </div>
        <div className="card space-y-3">
          <div className="card-title"><span className="section-accent" /> Preço mínimo (R$/kg)</div>
          <div className="text-3xl font-bold">
            {cultivo && precosMin?.ok ? (
              (() => {
                const info = (precosMin.cultivos as any)?.[cultivo]
                return info?.precoMinimo != null ? `R$ ${Number(info.precoMinimo).toFixed(2)}` : '—'
              })()
            ) : '—'}
          </div>
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
