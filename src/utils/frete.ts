// services/frete.ts
export type Municipio = { id: string; nome: string }
export type FreteRegistro = {
  mes_referencia: string
  fonte: string
  origem: string
  destino: string
  distancia_em_km: number
  vlr_tonelada_km: number
  vlr_tonelada: number
}

const BASE_URL = "https://pentahoportaldeinformacoes.conab.gov.br/pentaho/plugin/cda/api/doQuery"

async function fetchCDA<T>(params: Record<string, string | number>): Promise<T[]> {
  const qs = new URLSearchParams(params as any).toString()
  const res = await fetch(`${BASE_URL}?${qs}`, {
    headers: {
      "Host": "pentahoportaldeinformacoes.conab.gov.br",
      "Origin": "https://pentahoportaldeinformacoes.conab.gov.br",
      "Referer": "https://pentahoportaldeinformacoes.conab.gov.br/pentaho/api/repos/%3Ahome%3Afrete%3Afrete.wcdf/generatedContent?userid=pentaho&password=password"
    }
  })
  const data = await res.json()
  if (!data.resultset) return []
  return data.resultset.map((row: any[]) =>
    Object.fromEntries(data.metadata.map((m: any, i: number) => [m.colName, row[i]]))
  )
}

// 1. Buscar municípios de origem
export async function getMunicipiosOrigem() {
  const res = await fetch(
    "https://pentahoportaldeinformacoes.conab.gov.br/pentaho/plugin/cda/api/doQuery?path=%2Fhome%2Ffrete%2Ffrete.cda&dataAccessId=municipioOrigem&paramfonte=%5BFonte%5D.%5BPESQUISA%5D%2C+%5BFonte%5D.%5BCONTRATO%5D",
    { credentials: "include" }
  )
  if (!res.ok) throw new Error("Erro ao buscar municípios origem")

  const data = await res.json()

  return data.resultset.map((row: [string, string]) => ({
    full: row[0],
    nome: row[1]
  }))
}

export async function getMunicipiosDestino(origem: string) {
  const res = await fetch(
    `https://pentahoportaldeinformacoes.conab.gov.br/pentaho/plugin/cda/api/doQuery?path=%2Fhome%2Ffrete%2Ffrete.cda&dataAccessId=municipioDestino&parammunicipioOrigem=${encodeURIComponent(origem)}&paramfonte=%5BFonte%5D.%5BPESQUISA%5D%2C+%5BFonte%5D.%5BCONTRATO%5D`,
    { credentials: "include" }
  )
  if (!res.ok) throw new Error("Erro ao buscar municípios destino")

  const data = await res.json()

  return data.resultset.map((row: [string, string]) => ({
    full: row[0],    // "[Municipio Destino.New Hierarchy 0].[RIO DE JANEIRO-RJ]"
    nome: row[1]     // "RIO DE JANEIRO-RJ"
  }))
}

// 3. Buscar último ano com dados
export async function getUltimoAno(origem: string, destino: string): Promise<number> {
  const data = await fetchCDA<{ ULTIMOANO: number }>({
    parammunicipioOrigemConsulta: origem,
    parammunicipioDestinoConsulta: destino,
    paramorigemPreenchida: 1,
    paramdestinoPreenchido: 1,
    path: "/home/frete/frete.cda",
    dataAccessId: "ultimoAnoComDado",
    outputIndexId: 1,
    pageSize: 0,
    pageStart: 0,
  })
  return data.length > 0 ? Number(Object.values(data[0])[0]) : new Date().getFullYear()
}

// 4. Buscar tabela de fretes para ano escolhido
export async function getTabelaFrete(origem: string, destino: string, ano: number): Promise<FreteRegistro[]> {
  return await fetchCDA<FreteRegistro>({
    parammunicipioOrigemConsulta: origem,
    parammunicipioDestinoConsulta: destino,
    paramtodosMunicipiosOrigem: "-",
    paramtodosMunicipiosDestino: "-",
    paramfonteConsulta: 1,
    path: "/home/frete/frete.cda",
    dataAccessId: "tabelaFretes",
    outputIndexId: 1,
    pageSize: 0,
    pageStart: 0,
    paramanoInicio: ano,
    paramanoFim: ano,
    parammesInicio: "01",
    parammesFim: "12",
  })
}
