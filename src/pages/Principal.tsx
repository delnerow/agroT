import { useState } from 'react'
import FarmGrid from '../components/FarmGrid'

// Placeholder: clima atual e previsão (usar VITE_OPENWEATHER_API_KEY depois)
const mockWeatherNow = { temp: 26, rainChance: 30 }
const mockForecast = [
  { day: 'Amanhã', temp: 27, rainChance: 20 },
  { day: '2 dias', temp: 25, rainChance: 50 },
  { day: '3 dias', temp: 24, rainChance: 60 },
]

export default function Principal() {
  const [layer, setLayer] = useState<'temperatura' | 'umidade'>('temperatura')
  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-3 gap-4">
        <div className="col-span-1 card">
          <h2 className="card-title mb-2"><span className="section-accent" /> Clima agora</h2>
          <div className="text-4xl font-bold">{mockWeatherNow.temp}°C</div>
          <div className="text-sm text-gray-500">Chance de chuva: {mockWeatherNow.rainChance}%</div>
        </div>
        <div className="col-span-2 card">
          <h2 className="card-title mb-2"><span className="section-accent" /> Próximos dias</h2>
          <div className="grid grid-cols-3 gap-3">
            {mockForecast.map((f) => (
              <div key={f.day} className="border rounded-lg p-3">
                <div className="text-sm text-gray-500">{f.day}</div>
                <div className="text-2xl font-semibold">{f.temp}°C</div>
                <div className="text-xs">Chuva: {f.rainChance}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title"><span className="section-accent" /> Mapa da fazenda (grade de sensores)</h2>
          <div className="flex items-center gap-2 text-sm">
            <span>Filtro:</span>
            <button
              onClick={() => setLayer('temperatura')}
              className={layer==='temperatura' ? 'btn-primary' : 'btn-outline'}
            >Temperatura</button>
            <button
              onClick={() => setLayer('umidade')}
              className={layer==='umidade' ? 'btn-primary' : 'btn-outline'}
            >Umidade</button>
          </div>
        </div>
        <FarmGrid layer={layer} rows={10} cols={10} />
        <p className="text-xs text-gray-500">Área total: 40 ha (quatro módulos fiscais). Grade fictícia 10x10 para sensores distribuídos.</p>
      </section>
    </div>
  )
}
