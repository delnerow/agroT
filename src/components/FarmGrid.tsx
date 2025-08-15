import { useMemo, useState, useRef } from 'react'

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
    return `rgb(${r}, 80, ${b}, 0.5)`
  }
  // umidade: marrom (seco) -> verde (úmido)
  const u = Math.max(0, Math.min(100, value)) / 100
  const r = Math.round(160 * (1 - u) + 30)
  const g = Math.round(180 * u + 40)
  const b = Math.round(60 * (1 - u) + 40)
  return `rgb(${r}, ${g}, ${b},0.5)`
}

export default function FarmGrid({ rows, cols, layer }: Props) {
  const data = useMockGrid(rows, cols)
   const [hover, setHover] = useState<{ r: number; c: number; val: number; left: number; top: number } | null>(null)
   const containerRef = useRef<HTMLDivElement>(null)
   const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: '2px',
    width: '100%',
    aspectRatio: `${cols} / ${rows}`,
    position: 'relative', // necessário para posicionar tooltip
    backgroundImage: `url('/images/fazenda.png')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '0.5rem',
  }
  return (
     <div style={{ position: 'relative' }}>
      <div ref={containerRef} style={containerStyle}>
        {data.map((cell, idx) => {
          const r = Math.floor(idx / cols)
          const c = idx % cols
          const val = layer === 'temperatura' ? cell.temp : cell.umid

          return (
            <div
              key={idx}
              className="rounded-[2px]"
              style={{ backgroundColor: colorFor(val, layer) }}
              onMouseEnter={e => {
                if (!containerRef.current) return
                const containerRect = containerRef.current.getBoundingClientRect()
                const cellWidth = containerRect.width / cols
                const cellHeight = containerRect.height / rows
                const left = c * cellWidth + cellWidth / 2
                const top = r * cellHeight + cellHeight / 2
                setHover({ r, c, val, left, top })
              }}
              onMouseLeave={() => setHover(null)}
            />
          )
        })}
      </div>

      {hover && (
        <div
          style={{
            position: 'absolute',
            left: hover.left,
            top: hover.top,
            transform: 'translate(-50%, -50%)', // centraliza o balão na célula
            background: 'rgba(255,255,255,0.9)',
            padding: '4px 8px',
            borderRadius: '4px',
            pointerEvents: 'none',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
          }}
        >
          Célula ({hover.r + 1}, {hover.c + 1}): {layer === 'temperatura' ? `${hover.val}°C` : `${hover.val}% umidade`}
        </div>
      )}
    </div>
  )
}
