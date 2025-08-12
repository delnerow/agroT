// Express server to scrape CONAB pages (no official API)
import express from 'express'
import cors from 'cors'
import { load as loadHtml } from 'cheerio'
import axios from 'axios'

const PORT = process.env.PORT || 3001
const BASE = 'https://portaldeinformacoes.conab.gov.br'
const URL_PRECOS_MINIMOS = `${BASE}/precos-minimos.html`

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => res.json({ ok: true }))

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
