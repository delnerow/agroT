// /pages/api/scadabr/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'

// URL do seu ScadaBR (ajuste para o IP/porta corretos)
const SCADABR_BASE_URL = 'http://localhost:8080/scadabr/rest/v1'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Exemplo: busca valores de sensores de umidade por ID de cultivo
      // Ajuste os IDs conforme seus pontos no ScadaBR
      const cultivoIds = ['cultivo1', 'cultivo2']
      const dados: Record<string, any> = {}

      for (const id of cultivoIds) {
        const r = await fetch(`${SCADABR_BASE_URL}/data-points/${id}`)
        const json = await r.json()
        dados[id] = {
          umidadeAtual: json.value, // supondo que json.value contenha %
          ultimaIrrigacao: json.timestamp // timestamp da última medição
        }
      }

      return res.status(200).json(dados)
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro no servidor' })
  }
}
