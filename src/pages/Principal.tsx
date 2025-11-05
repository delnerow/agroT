import { useState } from "react"
import FarmGrid from "../components/FarmGrid"
import { useWeather } from "../hooks/useWeather"

export default function Principal() {
  const [layer, setLayer] = useState<"temperatura" | "umidade">("temperatura")
  const { now, forecast, loading, error } = useWeather()

  return (
    <div className="space-y-6">
      <section className="grid md:grid-cols-3 gap-4">
        <div className="col-span-1 card">
          <h2 className="card-title mb-2">
            <span className="section-accent" /> Clima agora
          </h2>
          {loading && <p>Carregando...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {now && (
            <>
              <div className="text-4xl font-bold">{now.temp}°C</div>
              <div className="text-sm text-gray-500">
                Chance de chuva: {now.rainChance} mm
              </div>
            </>
          )}
        </div>

        <div className="col-span-2 card">
          <h2 className="card-title mb-2">
            <span className="section-accent" /> Próximos dias
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {forecast.map((f) => (
              <div key={f.day} className="border rounded-lg p-3">
                <div className="text-sm text-gray-500">{f.day}</div>
                <div className="text-2xl font-semibold">{f.temp}°C</div>
                <div className="text-xs">Chuva: {f.rainChance} mm</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="card-title">
            <span className="section-accent" /> Mapa da fazenda (grade de sensores)
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span>Filtro:</span>
            <button
              onClick={() => setLayer("temperatura")}
              className={`btn-outline px-3 py-1 rounded ${layer === "temperatura" ? "bg-green-100 border-green-400" : ""}`}
            >
              Temperatura
            </button>
            <button
              onClick={() => setLayer("umidade")}
              className={`btn-outline px-3 py-1 rounded ${layer === "umidade" ? "bg-green-100 border-green-400" : ""}`}
            >
              Umidade
            </button>
          </div>
        </div>

        {/* Contêiner com grid e imagem sobreposta */}
        <div className="relative w-full">
          {/* Imagem do mesmo tamanho do grid */}
          <img
            src="../images/fazenda.png"
            alt="Imagem da fazenda"
            className="absolute inset-0 w-full h-full object-cover rounded-lg z-0"
            style={{ zIndex: 0 }}
          />
          {/* Grid sobre a imagem */}
          <div className="relative z-10">
            <FarmGrid layer={layer} rows={10} cols={10} />
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Área total: 40 ha (quatro módulos fiscais). Grade fictícia 10x10 para sensores distribuídos.
        </p>
      </section>
    </div>
  )
}
