import { useEffect, useState } from "react"
import { useCultivosStore } from "../stores/cultivos"

export function useWeather() {
  const { fazenda } = useCultivosStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState<{ temp: number; rainChance: number } | null>(null)
  const [forecast, setForecast] = useState<{ day: string; temp: number; rainChance: number }[]>([])

  useEffect(() => {
    if (!fazenda.localizacao) return
    const { lat, lng } = fazenda.localizacao

    async function fetchWeather() {
      try {
        setLoading(true)
        setError(null)

        // API: clima atual + previsão
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,precipitation_probability_max&timezone=auto`
        const res = await fetch(url)
        const data = await res.json()

        // Clima atual
        setNow({
          temp: Math.round(data.current_weather.temperature),
          rainChance: data.daily.precipitation_probability_max[0] ?? 0,
        })

        // Próximos 3 dias
        setForecast(
          data.daily.time.slice(1, 4).map((date: string, i: number) => ({
            day: i === 0 ? "Amanhã" : `${i + 1} dias`,
            temp: Math.round(data.daily.temperature_2m_max[i + 1]),
            rainChance: data.daily.precipitation_probability_max[i + 1] ?? 0,
          }))
        )
      } catch (err) {
        setError("Erro ao buscar clima")
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [fazenda.localizacao])

  return { now, forecast, loading, error }
}
