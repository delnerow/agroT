// /pages/api/scadabr/regar.ts
import type { NextApiRequest, NextApiResponse } from 'next'

const SCADABR_BASE_URL = 'http://localhost:8080/scadabr/rest/v1'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { cultivoId, metodo } = req.body

    // Exemplo: enviar comando para acionar irrigação via ScadaBR
    // Aqui você teria que mapear cada cultivo para um output (digital output)
    await fetch(`${SCADABR_BASE_URL}/data-points/${cultivoId}/value`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: 1 }) // 1 = ligar irrigação
    })

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Erro ao acionar irrigação' })
  }
}
