import { useMemo, useState } from 'react'

type Layer = 'temperatura' | 'umidade'

interface Props {
  rows: number
  cols: number
  layer: Layer
}

// Gera dados simulados estáveis por célula
function useMockGrid(rows: number, cols: number) {
  const data = useMemo(() => {
    const items: { temp: number; umid: number }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const base = 20 + ((r * 13 + c * 7) % 10) // 20..29
        const temp = base + ((r + c) % 5) // 20..33
        const umid = 40 + ((r * 5 + c * 3) % 50) // 40..89
        items.push({ temp, umid })
      }
    }
    return items
  }, [rows, cols])
  return data
}

function colorFor(value: number, layer: Layer) {
  if (layer === 'temperatura') {
    // azul (frio) -> vermelho (quente)
    const t = Math.max(10, Math.min(40, value))
    const ratio = (t - 10) / 30
    const r = Math.round(255 * ratio)
    const b = Math.round(255 * (1 - ratio))
    return `rgb(${r}, 80, ${b})`
  }
  // umidade: marrom (seco) -> verde (úmido)
  const u = Math.max(0, Math.min(100, value)) / 100
  const r = Math.round(160 * (1 - u) + 30)
  const g = Math.round(180 * u + 40)
  const b = Math.round(60 * (1 - u) + 40)
  return `rgb(${r}, ${g}, ${b})`
}

export default function FarmGrid({ rows, cols, layer }: Props) {
  const data = useMockGrid(rows, cols)
  const [hover, setHover] = useState<{ r: number; c: number; val: number } | null>(null)

  return (
    <div>
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {data.map((cell, idx) => {
          const r = Math.floor(idx / cols)
          const c = idx % cols
          const val = layer === 'temperatura' ? cell.temp : cell.umid
          return (
            <div
              key={idx}
              className="relative aspect-square rounded-[2px] border border-white"
              style={{ backgroundColor: colorFor(val, layer) }}
              onMouseEnter={() => setHover({ r, c, val })}
              onMouseLeave={() => setHover(null)}
            />
          )
        })}
      </div>
      {hover && (
        <div className="mt-2 text-sm text-gray-700">
          Célula ({hover.r + 1}, {hover.c + 1}): {layer === 'temperatura' ? `${hover.val}°C` : `${hover.val}% umidade`}
        </div>
      )}
    </div>
  )
}
