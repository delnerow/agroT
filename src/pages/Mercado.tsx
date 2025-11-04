import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCultivosStore } from '../stores/cultivos'

// Os cultivos agora vêm da aba "Cultivos" via Zustand store

// Interface para resposta da API
interface ApiResponse {
  ok: boolean;
  data?: {
    metadata?: any[];
    resultset?: any[];
  };
  resultset?: any[];
}

// Removidos mocks de produtos/preço mínimo; dados reais virão do backend


function formatColName(colName: string) {
  switch(colName) {
    case 'mes_referencia': return 'Mês Referência';
    case 'fonte': return 'Fonte';
    case 'vlr_tonelada': return 'Valor Tonelada';
    case 'vlr_tonelada_km': return 'Valor Tonelada/KM';
    default: return colName;
  }
}
export default function Mercado() {
  const cultivosStore = useCultivosStore(s => s.cultivos)
  const fazenda = useCultivosStore(s => s.fazenda)
  const cultivoNames = useMemo(() => cultivosStore.map(c => c.nome).filter(Boolean), [cultivosStore])
  const [cultivo, setCultivo] = useState<string>('')
  const [destinos, setDestinos] = useState<string[]>([])
  const [destinoSelecionado, setDestinoSelecionado] = useState<string>(''); 
  const [origem, setOrigem] = useState('')
  const [toneladas, setToneladas] = useState<number>(0);
  const [frete, setFrete] = useState<number | null>(null)
  const [erro, setErro] = useState(false)
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


  const { data: origensData, isLoading: loadingOrigens } = useQuery({
  queryKey: ['origens-frete'],
  queryFn: async () => {
    const res = await fetch('/api/conab/frete/origens');
    if (!res.ok) throw new Error('Falha ao buscar origens');
    return res.json() as Promise<{ ok: boolean; data: { metadata?: any[]; resultset?: any[] } }>;
  },
});

const origensList = origensData?.data?.resultset?.map((item) => item[1]) || [];

const { data: destinosData, isLoading: loadingDestinos } = useQuery({
  queryKey: ['destinos-frete', origem],
  queryFn: async () => {
    if (!origem) return { resultset: [] };
    const res = await fetch(`/api/conab/frete/destinos?origem=${encodeURIComponent(origem)}`);
    if (!res.ok) throw new Error('Falha ao buscar origens');
    return res.json() as Promise<{ ok: boolean; data: { metadata?: any[]; resultset?: any[] } }>;
  },
  enabled: !!origem, // só roda quando há origem selecionada
});

  const {data: anoData, isLoading: loadingAno} = useQuery({
    queryKey: ['ultimo-ano-frete', origem, destinoSelecionado],
    queryFn: async () => {
  if (!origem || !destinoSelecionado) return { ok: true, data: { metadata: [], resultset: [] } };
  const res = await fetch(
    `/api/conab/frete/ultimo-ano?origem=${encodeURIComponent(origem)}&destino=${encodeURIComponent(destinoSelecionado)}`
  );
  if (!res.ok) throw new Error('Falha ao buscar último ano');
  return res.json() as Promise<{ ok: boolean; data: { metadata?: any[]; resultset?: any[] } }>;
},
    enabled: !!origem && !!destinoSelecionado,
  })
  

const { data: tabelaData, isLoading: loadingTabela1 } = useQuery({
  queryKey: ['tabela-frete', origem, destinoSelecionado, anoData],
  queryFn: async () => {
    if (!origem || !destinoSelecionado || !anoData) return { resultset: [] };
    
    const res = await fetch(
      `/api/conab/frete/tabela?origem=${encodeURIComponent(origem)}&destino=${encodeURIComponent(destinoSelecionado)}&ano=${encodeURIComponent(anoData?.data?.resultset?.[0]?.[0])}`
    );
    if (!res.ok) throw new Error('Falha ao buscar tabela de fretes');
    return res.json() as Promise<{ ok: boolean; data: { metadata?: any[]; resultset?: any[] } }>;
  },
  enabled: !!origem && !!destinoSelecionado && !!anoData,
});


  async function fetchDestinos(origem: string) {
    const res = await fetch(`/api/conab/frete/destinos?origem=${encodeURIComponent(origem)}`)
    const data = await res.json()
    setDestinos(data)
  }
 useEffect(() => {
  if (origem) fetchDestinos(origem)
}, [origem])

function calcularFrete() {
  if (!tabelaData?.data?.resultset?.length) return;

  // Exemplo de cálculo: média de vlr_tonelada * toneladas
  const total = tabelaData.data.resultset.reduce((acc, row) => acc + Number(row[5]), 0); // vlr_tonelada_km
  const media = total / tabelaData.data.resultset.length;

  setFrete(media * toneladas);
}

 

  // Data para consulta da Conjuntura (default: segunda-feira da última semana completa)
function lastFullWeekMondayISO(base: Date = new Date()) {
  // normaliza para meia-noite local (evita efeito de fuso ao formatar)
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());

  // 0 = segunda, 1 = terça, ... 6 = domingo
  const dowMon0 = (today.getDay() + 6) % 7;

  // volta para a segunda desta semana e depois -7 dias (segunda da semana passada)
  const prevMonday = new Date(today);
  prevMonday.setDate(today.getDate() - dowMon0 - 7);

  // formata em YYYY-MM-DD (local, sem UTC)
  const y = prevMonday.getFullYear();
  const m = String(prevMonday.getMonth() + 1).padStart(2, '0');
  const d = String(prevMonday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
  const [dataConj, setDataConj] = useState<string>(lastFullWeekMondayISO())

  // Placeholder calculadora de frete (CONAB): valor por km e distância
  const [distKm, setDistKm] = useState(120)
  const [valorPorKm, setValorPorKm] = useState(5.2)
  const freteEstimado = (distKm * valorPorKm).toFixed(2)

  // Backend: preços mínimos por cultivos cadastrados
  const cultivosNomes = useMemo(() => cultivoNames.join(','), [cultivoNames])


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

      const res = await fetch(`/api/conab/produtos360/precos?produto=${cultivo.toUpperCase()}`)
      if (!res.ok) throw new Error('Falha ao consultar preços (tabela)')
      return res.json() as Promise<{ ok: boolean; data: { metadata?: any[]; resultset?: any[] } }>
    },
    enabled: !!cultivo,
  })

  function renderCdaTable(
  data?: { metadata?: any[]; resultset?: any[] },
  uf?: string
) {
  if (!data?.metadata || !data?.resultset) {
    return (
      <div className="text-sm text-gray-500 p-4 text-center">
        Nenhuma tabela de preços encontrada.
      </div>
    );
  }

  // 🔹 Encontra índices únicos (primeira ocorrência de cada colName)
  const seen = new Set<string>();
  let uniqueIndexes: number[] = [];
  data.metadata.forEach((m, i) => {
    if (!seen.has(m.colName)) {
      seen.add(m.colName);
      uniqueIndexes.push(i);
    }
  });
  uniqueIndexes = uniqueIndexes.slice(0, -1);
  // 🔹 Filtra e renomeia headers
  const headers = uniqueIndexes.map((i) => {
    const name = data.metadata[i].colName;
    switch (name) {
      case "Regionalizacao.Regionalizacao":
        return "UF";
      case "UltimoPrecoMedio":
        return "P. Médio Semanal";
      case "UltimoPrecoMinimo":
        return "P. Mínimo";
      case "DifPercentualPrecoMedio":
        return "Variação Semanal%";
      case "DifPercentualPrecoMedioMensal":
        return "Variação Mensal%";
      case "DifPercentualPrecoMedioAnual":
        return "Variação Anual%";
      case "DifPercentualPrecoMedioMinimo":
        return "P. Médio/ Mínimo %";
      default:
        return name;
    }
  });

  // 🔹 Filtra linhas mantendo apenas colunas únicas
  let filteredRows = data.resultset.map((row) =>
    uniqueIndexes.map((i) => row[i])
  );

  // 🔹 Filtra por UF (se informado)
  const ufIndex = headers.indexOf("UF");
  if (uf && ufIndex !== -1) {
    filteredRows = filteredRows.filter((row) => row[ufIndex] === uf);
  }

  if (filteredRows.length === 0) {
    return (
      <div className="text-sm text-gray-500 p-4 text-center">
        {uf
          ? `Nenhuma cotação encontrada para a UF "${uf}".`
          : "Nenhuma tabela de preços encontrada."}
      </div>
    );
  }

  // 🔹 Formata as células
  const formatCell = (cell: any, header: string) => {
    if (typeof cell === "number") {
      const fixedValue = cell.toFixed(2);
      if (header.includes("Variação")) {
        if (cell > 0)
          return (
            <span className="flex items-center gap-1 text-green-600 font-semibold">
              ▲ {fixedValue}%
            </span>
          );
        if (cell < 0)
          return (
            <span className="flex items-center gap-1 text-red-600 font-semibold">
              ▼ {Math.abs(cell).toFixed(2)}%
            </span>
          );
        return <span>{fixedValue}%</span>;
      }
      return fixedValue;
    }
    return cell;
  };

  // 🔹 Renderiza a tabela
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-sm text-left text-gray-800">
        <thead className="bg-gray-50 text-xs uppercase tracking-wider">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredRows.map((row, i) => (
            <tr key={i} className="hover:bg-sky-50/50">
              {row.map((cell, j) => (
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
            <div className="mt-1 text-xs text-gray-500">Escolha uma segunda para mostrar a conjuntura daquela semana inteira</div>
          </label>
        </div>
      </section>

      <section className="card p-4 space-y-4">
  <div className="card-title flex items-center gap-2">
    <span className="section-accent" /> Conjuntura
  </div>

  <div className="flex flex-col md:flex-row gap-6">
    {/* Coluna da Conjuntura */}
    <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow-sm">
      {loadingConj && <div className="text-sm text-gray-500">Carregando conjuntura...</div>}
      {errorConj && <div className="text-sm text-red-600">Falha ao consultar conjuntura.</div>}
      {conjResp?.data && (
        <div className="text-gray-700 text-base md:text-lg whitespace-pre-wrap">
          {conjResp.data.resultset?.[0]?.[1] || 'Nenhum comentário de analista encontrado.'}
        </div>
      )}
    </div>

    {/* Coluna da Imagem do Cultivo */}
    <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg p-4 shadow-sm">
      {cultivo && (
        <img
          src={`/images/${cultivo}.jpg`}
          alt={cultivo}
          className="max-w-full max-h-64 object-contain rounded-md shadow-md"
        />
      )}
    </div>
  </div>
</section>

      <section className="card space-y-3">
        
        {!cultivosNomes && (
          <div className="text-sm text-gray-500">Cadastre seus cultivos na aba “Cultivos” para consultar preços mínimos.</div>
        )}
        
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">Tabela (Estado, P. Médio Semanal, P. Mínimo, etc.)</div>
          {loadingTabela && <div className="text-sm text-gray-500">Carregando tabela...</div>}
          {errorTabela && <div className="text-sm text-red-600">Falha ao consultar tabela de preços.</div>}
          {!loadingTabela && !errorTabela && renderCdaTable(precosResp?.data, fazenda.uf)}
        </div>
      </section>

  
        <section className="card space-y-3">
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {/* Imagem Oferta e Demanda */}
           <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Oferta e Demanda</h2>
       <div className="w-full h-auto border rounded-md bg-gray-50 flex items-center justify-center p-4">
      {erro ? (
        <span className="text-gray-500 text-center">Sem dados da CONAB</span>
      ) : (
        <img
          src={`/api/conab/oferta-demanda?produto=${cultivo}`}
          alt={`Oferta e Demanda de ${cultivo}`}
          className="w-full h-auto"
          onError={() => setErro(true)}
        />
      )}
    </div>
      </div>
        </section>


      <section className="card space-y-3">
  <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
    <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Calculadora de Frete</h2>

    {/* Origem e Destino */}
    <div className="grid sm:grid-cols-2 gap-4">
      <label>
        Origem:
        <select
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
        >
          {loadingOrigens ? <option>Carregando...</option> :
            origensList.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>

      <label>
        Destino:
        <select
          value={destinoSelecionado}
          onChange={(e) => setDestinoSelecionado(e.target.value)}
          disabled={!origem || loadingDestinos}
        >
          <option value="">{loadingDestinos ? 'Carregando destinos...' : 'Escolha um destino'}</option>
          {destinosData?.data?.resultset?.map((d: any[]) => (
            <option key={d[1]} value={d[1]}>{d[1]}</option>
          ))}
        </select>
      </label>
    </div>

    <div className="flex space-x-6 items-center">
  {/* Último ano disponível */}
  <div>
    Último Ano:{" "}
    {loadingAno ? (
      <span>Carregando...</span>
    ) : (
      <span>{anoData?.data?.resultset?.[0]?.[0]}</span>
    )}
  </div>

  {/* Distância entre as cidades */}
  <div>
    Distância:{" "}
    {loadingTabela1 ? (
      <span>Carregando...</span>
    ) : tabelaData?.data?.resultset?.length > 0 ? (
      <span>{tabelaData.data.resultset[0][4]} km</span>
    ) : (
      <span>-</span>
    )}
  </div>
</div>

    {/* Tabela ocupando linha inteira */}
    {loadingTabela1 && <p>Carregando tabela...</p>}
    {!loadingTabela1 && tabelaData?.data?.resultset?.length > 0 && (
  <div className="overflow-x-auto mt-4">
    <table className="min-w-full border">
      <thead>
        <tr>
          {tabelaData.data.metadata
            ?.filter(col => !['origem','destino','distancia_em_km'].includes(col.colName))
            .map(col => (
              <th key={col.colIndex} className="border px-2 py-1">
                {formatColName(col.colName)}
              </th>
            ))}
        </tr>
      </thead>
      <tbody>
        {tabelaData.data.resultset.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => {
              const colName = tabelaData.data.metadata?.[j].colName;
              if (['origem','destino','distancia_em_km'].includes(colName)) return null;
              return <td key={j} className="border px-2 py-1">{cell}</td>;
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

    {/* Input de toneladas e botão só aparecem quando tabela carregou */}
    {!loadingTabela1 && tabelaData?.data?.resultset?.length > 0 && (
      <div className="flex gap-2 mt-4 items-end">
        <label className="block mb-2">
  Toneladas:
        <input
    type="number"
    value={toneladas}
    onChange={e => setToneladas(Number(e.target.value))}
        className="ml-2 border px-1"
      />
    </label>
    <button className="btn btn-primary ml-2" onClick={calcularFrete}>
      Calcular Frete
    </button>

    {frete != null && (
      <div className="mt-2 text-gray-700 font-semibold">
        Frete médio: R$ {frete.toFixed(2)}
      </div>
    )}
  </div>
)}
  </div>
</section>
<section className="card space-y-4 mt-6">
  <div className="bg-white rounded-lg shadow-md p-6 space-y-3">
    <h2 className="text-xl font-semibold text-gray-800 border-b pb-2">
      Programas de Apoio ao Agricultor
    </h2>

    <div className="grid sm:grid-cols-2 gap-4">
      {/* PRONAF */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-green-700">PRONAF</h3>
        <p className="text-gray-700 text-sm">
          Crédito com juros reduzidos para agricultores familiares investirem na
          produção, tecnologia e sustentabilidade.
        </p>
        <a
          href="https://www.bndes.gov.br/wps/portal/site/home/financiamento/produto/pronaf"
          target="_blank"
          className="text-green-600 text-sm mt-2 inline-block hover:underline"
        >
          Saiba mais →
        </a>
      </div>

      {/* PRONAMP */}
      <div className="border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-green-700">PRONAMP</h3>
        <p className="text-gray-700 text-sm">
          Linha de crédito para o médio produtor rural, com taxas especiais para
          custeio e investimento.
        </p>
        <a
          href="https://www.bndes.gov.br/wps/portal/site/home/financiamento/produto/pronamp-investimento"
          target="_blank"
          className="text-green-600 text-sm mt-2 inline-block hover:underline"
        >
          Saiba mais →
        </a>
      </div>

      {/* PAA */}
      <div className="border rounded-lg p-4 shadow-sm sm:col-span-2">
        <h3 className="text-lg font-semibold text-green-700">PAA</h3>
        <p className="text-gray-700 text-sm">
          Programa de Aquisição de Alimentos: garante mercado para pequenos
          agricultores por meio da compra pública de alimentos.
        </p>
        <a
          href="https://www.gov.br/secom/pt-br/acesso-a-informacao/comunicabr/lista-de-acoes-e-programas/programa-de-aquisicao-de-alimentos-paa"
          target="_blank"
          className="text-green-600 text-sm mt-2 inline-block hover:underline"
        >
          Saiba mais →
        </a>
      </div>
    </div>
  </div>
</section>
      <p className="text-xs text-gray-500">Fonte: CONAB em https://portaldeinformacoes.conab.gov.br.</p>
    </div>
  )
}
