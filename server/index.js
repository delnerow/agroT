// Express server to scrape CONAB pages (no official API)
import express from 'express'
import cors from 'cors'
import { load as loadHtml } from 'cheerio'
import axios from 'axios'
import https from 'https'

const PORT = process.env.PORT || 3001
const BASE = 'https://portaldeinformacoes.conab.gov.br'
const URL_PRECOS_MINIMOS = `${BASE}/precos-minimos.html`
// Produtos 360 (Pentaho CDA)
const PENTAHO_BASE = 'https://pentahoportaldeinformacoes.conab.gov.br'
const FRETE_URL = 'https://pentahoportaldeinformacoes.conab.gov.br/pentaho/api/repos/%3Ahome%3Afrete%3Afrete.wcdf/generatedContent';

const IFRAME_URL = `${PENTAHO_BASE}/pentaho/api/repos/%3Ahome%3AProdutos%3Aprodutos360.wcdf/generatedContent?userid=pentaho&password=password`
const CDA_ENDPOINT = `${PENTAHO_BASE}/pentaho/plugin/cda/api/doQuery`

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// --- Produtos 360 helpers & endpoints (top-level) ---
const axiosPentaho = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  validateStatus: () => true,
  timeout: 20000,
})

async function openPentahoFrete() {
  const auth = Buffer.from(`pentaho:password`).toString('base64');
  const headers = {
    'Authorization': `Basic ${auth}`,
    'Accept': '*/*',
  };

  const r = await axiosPentaho.get(FRETE_URL, { headers });
  const setCookies = r.headers?.['set-cookie'] || [];
  const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ');

  if (!cookieHeader) {
    const msg = `Falha ao abrir sessão Pentaho. Status=${r.status}. Headers recebidos: ${Object.keys(r.headers||{}).join(', ')}`;
    throw new Error(msg);
  }

  return cookieHeader;
}

async function postFRETE(cookie, params) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Referer': FRETE_URL,
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': PENTAHO_BASE,
    'Cookie': cookie,
  }
  const r = await axiosPentaho.post(CDA_ENDPOINT, params, { headers })
  if (r.status >= 400) {
    console.error('Pentaho CDA error', r.status, r.statusText)
  }
  return { status: r.status, headers: r.headers, data: r.data }
}

async function openPentahoSession() {
  const r = await axiosPentaho.get(IFRAME_URL)
  const setCookies = r.headers?.['set-cookie'] || []
  const cookieHeader = setCookies.map(c => c.split(';')[0]).join('; ')
  if (!cookieHeader) {
    const msg = `Falha ao abrir sessão Pentaho. Status=${r.status}. Headers recebidos: ${Object.keys(r.headers||{}).join(', ')}`
    throw new Error(msg)
  }
  return cookieHeader
}

async function postCDA(cookie, params) {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Referer': IFRAME_URL,
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': PENTAHO_BASE,
    'Cookie': cookie,
  }
  const r = await axiosPentaho.post(CDA_ENDPOINT, params, { headers })
  if (r.status >= 400) {
    console.error('Pentaho CDA error', r.status, r.statusText)
  }
  return { status: r.status, headers: r.headers, data: r.data }
}

// GET /api/conab/produtos360/conjuntura?produto=SOJA&data=2025-07-28
app.get('/api/conab/produtos360/conjuntura', async (req, res) => {
  try {
    const produto = String(req.query.produto || '').trim()
    let data = String(req.query.data || '').trim() // YYYY-MM-DD
    if (!produto) return res.status(400).json({ error: 'Parâmetro obrigatório: produto' })
    // Default: segunda-feira da última semana completa

    const produtoUpper = produto.toUpperCase().split(' ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const cookie = await openPentahoSession()
    const body = [
      'path=/home/Produtos/produtos360.cda',
      'outputIndexId=1',
      'pageSize=0',
      'pageStart=0',
      'sortBy=',
      'paramsearchBox=',
      `paramdata_conjuntura=${encodeURIComponent(data)}`,
      `paramproduto=${encodeURIComponent(produtoUpper)}`,
      'dataAccessId=conjuntura',
    ].join('&')
    const cda = await postCDA(cookie, body)
    res.json({ ok: true, referencia: { produto: produtoUpper, data }, cdaStatus: cda.status, data: cda.data })
  } catch (e) {
    console.error('Erro /produtos360/conjuntura:', e)
    res.status(500).json({ error: 'Falha ao consultar conjuntura', details: String(e) })
  }
})

// GET /api/conab/produtos360/precos?produto=MILHO
app.get('/api/conab/produtos360/precos', async (req, res) => {
 
  try {
    const produto = String(req.query.produto || '').trim()
    if (!produto) return res.status(400).json({ error: 'Parâmetro obrigatório: produto' })
    
  
    const cookie = await openPentahoSession()
    // Pentaho espera o valor no formato [Produto].[MILHO]
    let produtoUpper = produto.toUpperCase()
    
    if(produtoUpper === 'ARROZ') {
      produtoUpper = 'ARROZ LONGO FINO EM CASCA'
    }
    if(produtoUpper === 'CAFE') {
      produtoUpper = 'CAFÉ ARÁBICA'
    }
    
    const produtoDim = `[Produto].[${produtoUpper}]`
    const body = [
      'path=/home/Produtos/produtos360.cda',
      'outputIndexId=1',
      'pageSize=0',
      'pageStart=0',
      'sortBy=',
      'paramsearchBox=',
      `paramprodutoPreco=${encodeURIComponent(produtoDim)}`,
      'dataAccessId=precoProduto',
      'outputType=json',
    ].join('&')
    const cda = await postCDA(cookie, body)
    res.json({ ok: true, cdaStatus: cda.status, data: cda.data })
  } catch (e) {
    console.error('Erro /produtos360/precos:', e)
    res.status(500).json({ error: 'Falha ao consultar preços', details: String(e) })
  }
})


app.get('/api/conab/oferta-demanda', async (req, res) => {
  try {
    const produto = String(req.query.produto || '').trim().toUpperCase().split(' ')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const url = `https://pentahoportaldeinformacoes.conab.gov.br/pentaho/plugin/cgg/api/services/draw?outputType=png&script=%2Fhome%2FOfertaDemanda%2FgrafODSafra.js&paramproduto=%5BProduto%5D.%5B${produto}%5D&paramsafraInicial=%5BSafra%5D.%5B1999%2F00%5D&paramsafraFinal=%5BSafra%5D.%5B2024%2F25%5D&paramwidth=1000&paramheight=300`;
    const cookie = await openPentahoSession()
    // Faz a requisição para a Conab
    const response = await fetch(url, {
      headers: {
        'Accept': 'image/png,image/*,*/*;q=0.8',
        'Connection': 'keep-alive',
        'Referer': 'https://pentahoportaldeinformacoes.conab.gov.br/',
        // Se precisar, adicione cookies ou user-agent
        'User-Agent': 'Mozilla/5.0',
        'Cookie': cookie
      }
    });

    const buffer = await response.arrayBuffer();
const bufferContent = Buffer.from(buffer);

// Conab sempre retorna PNG, mas podemos tentar detectar "No Data Found"
const contentString = bufferContent.toString('utf8');
if (contentString.includes("No Data Found")) {
  res.status(204).send(); // 204 No Content
} else {
  res.set('Content-Type', 'image/png');
  res.send(bufferContent);
}
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao obter imagem de Oferta e Demanda');
  }
});

app.get('/api/conab/frete/origens', async (_req, res) => {
  console.log('Rota /origens chamada'); // <<< log inicial
  try {

    const body = [
      'paramfonte=%5BFonte%5D.%5BPESQUISA%5D%2C+%5BFonte%5D.%5BCONTRATO%5D',
      'path=%2Fhome%2Ffrete%2Ffrete.cda',
      'dataAccessId=municipioOrigem',
      'outputIndexId=1',
      'pageSize=0',
      'pageStart=0',
      `sortBy=`,
      'paramsearchBox=',
    ].join('&')
    const cookie = await openPentahoFrete()
    const cda = await postFRETE(cookie, body)
    res.json({ ok: true, cdaStatus: cda.status, data: cda.data })
  } catch (e) {
    console.error('Erro /origens:', e);
if (e.response) {
  console.error('Response data:', e.response.data);
}
  }
})

app.get('/api/conab/frete/destinos', async (req, res) => {
  const origem = req.query.origem; // recebido do frontend
  if (!origem) return res.json({ metadata: {}, resultset: [] });

  try {
const body = [
      'parammunicipioOrigem=%5BMunicipio+Origem.New+Hierarchy+0%5D.%5B' + origem + '%5D',
      'paramfonte=%5BFonte%5D.%5BPESQUISA%5D%2C+%5BFonte%5D.%5BCONTRATO%5D',
      'path=%2Fhome%2Ffrete%2Ffrete.cda',
      'dataAccessId=municipioDestino',
      'outputIndexId=1',
      'pageSize=0',
      'pageStart=0',
      `sortBy=`,
      'paramsearchBox=',
    ].join('&')
    const cookie = await openPentahoFrete()
    const cda = await postFRETE(cookie, body)
    res.json({ ok: true, cdaStatus: cda.status, data: cda.data })
  } catch (e) {
    console.error('Erro /destinos:', e);
if (e.response) {
  console.error('Response data:', e.response.data);
}
  }
})
app.get('/api/conab/frete/ultimo-ano', async (req, res) => {
  const origem = req.query.origem;
  const destino = req.query.destino;

  if (!origem || !destino) return res.json({ metadata: {}, resultset: [] });

  try {
    const body = [
      'parammunicipioOrigemConsulta=' + origem,
      'parammunicipioDestinoConsulta=' + destino,
      'paramorigemPreenchida=1',
      'paramdestinoPreenchido=1',
      'path=%2Fhome%2Ffrete%2Ffrete.cda',
      'dataAccessId=ultimoAnoComDado',
      'outputIndexId=1',
      'pageSize=0',
      'pageStart=0',
      'sortBy=',
      'paramsearchBox='
    ].join('&');

    const cookie = await openPentahoFrete();
    const cda = await postFRETE(cookie, body);

    res.json({ ok: true, cdaStatus: cda.status, data: cda.data })
  } catch (e) {
    console.error('Erro /ultimo-ano:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/conab/frete/tabela?origem=RIO-DE-JANEIRO&destino=SAO-PAULO
app.get('/api/conab/frete/tabela', async (req, res) => {
  const { origem, destino, ano } = req.query;

  if (!origem || !destino || !ano) return res.json({ metadata: [], resultset: [] });

  try {
    const body = [
      `parammunicipioOrigemConsulta=${origem}`,
      `parammunicipioDestinoConsulta=${destino}`,
      'paramtodosMunicipiosOrigem=-',
      'paramtodosMunicipiosDestino=-',
      'paramfonteConsulta=1',
      'paramfonteConsulta=2',
      `paramanoInicio=${ano}`,
      'parammesInicio=01',
      'parammesFim=12',
      `paramanoFim=${ano}`,
      'path=%2Fhome%2Ffrete%2Ffrete.cda',
      'dataAccessId=tabelaFretes',
      'outputIndexId=1',
      'pageSize=0',
      'pageStart=0',
      'paramsearchBox='
    ].join('&');

    const cookie = await openPentahoFrete();
    const cda = await postFRETE(cookie, body);

    res.json({ ok: true, cdaStatus: cda.status, data: cda.data });
  } catch (e) {
    console.error('Erro /tabela:', e);
    if (e.response) console.error('Response data:', e.response.data);
    res.status(500).json({ ok: false, error: 'Erro ao buscar tabela de fretes' });
  }
});





// Diagnóstico simples de conectividade com Pentaho
app.get('/api/conab/debug/ping', async (_req, res) => {
  try {
    const r = await axiosPentaho.get(IFRAME_URL)
    res.json({ ok: true, status: r.status, hasSetCookie: !!(r.headers?.['set-cookie']||[]).length })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
})

// Helper: normalize string for matching (accent/case insensitive)
function norm(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

// GET /api/conab/precos-minimos?cultivos=Tomate,Milho
app.get('/api/conab/precos-minimos', async (req, res) => {
  try {
    const cultivosQ = String(req.query.cultivos || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!cultivosQ.length) {
      return res.status(400).json({ error: 'Parâmetro "cultivos" é obrigatório. Ex: cultivos=Tomate,Milho' })
    }
    const targets = cultivosQ.map(norm)

    const r = await axios.get(URL_PRECOS_MINIMOS, { responseType: 'text' })
    const html = r.data
    const $ = loadHtml(html)

    // Estratégia: coletar todas as tabelas e listas que contenham "preço" e mapear linhas
    const results = {}
    for (const t of targets) results[t] = null

    $('table').each((_, table) => {
      const headers = []
      $(table).find('thead th, tr th').each((__, th) => headers.push($(th).text().trim()))
      $(table).find('tbody tr, tr').each((__, tr) => {
        const cols = []
        $(tr).find('td, th').each((___, td) => cols.push($(td).text().replace(/\s+/g, ' ').trim()))
        if (!cols.length) return
        const rowText = cols.join(' | ')
        const rowNorm = norm(rowText)
        targets.forEach(t => {
          if (rowNorm.includes(t)) {
            // Heurística: procurar número na linha como possível preço mínimo (R$)
            const match = rowText.match(/(R\$\s*)?([0-9]+[\.,][0-9]{2})/)
            const preco = match ? match[2].replace(',', '.') : null
            results[t] = {
              fonte: URL_PRECOS_MINIMOS,
              headers,
              linha: cols,
              precoMinimo: preco ? Number(preco) : null,
            }
          }
        })
      })
    })

    // Fallback: procurar em elementos de texto
    if (Object.values(results).every(v => v === null)) {
      const text = $('body').text().replace(/\s+/g, ' ')
      const textNorm = norm(text)
      targets.forEach(t => {
        if (textNorm.includes(t) && text.match(/pre[cç]o m[ií]nimo/i)) {
          results[t] = { fonte: URL_PRECOS_MINIMOS, headers: [], linha: [], precoMinimo: null }
        }
      })
    }

    // Remap keys to original names
    const out = {}
    cultivosQ.forEach((orig, i) => {
      out[orig] = results[targets[i]]
    })

    res.json({ ok: true, cultivos: out })
  } catch (e) {
    console.error('Erro /precos-minimos:', e)
    res.status(500).json({ error: 'Falha ao coletar preços mínimos', details: String(e) })
  }
})

app.listen(PORT, () => {
  console.log(`CONAB connector running on http://localhost:${PORT}`)
})
