import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { useEffect, useState } from 'react'
import { useCultivosStore } from '../stores/cultivos'
import type { Plant, SensorData } from '../stores/cultivos'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

type Props = {
  plant: Plant | null
  onClose: () => void
}

export function HumidityPlotModal({ plant, onClose }: Props) {
  const [sensorData, setSensorData] = useState<SensorData[]>([])
  const getSensorData = useCultivosStore(state => state.getSensorData)

  useEffect(() => {
    if (plant) {
      getSensorData(plant.id).then(data => setSensorData(data))
    }
  }, [plant, getSensorData])

  if (!plant) return null

  const data = {
    labels: sensorData.map(d => new Date(d.timestamp).toLocaleString()),
    datasets: [
      {
        label: 'Umidade (%)',
        data: sensorData.map(d => d.humidity),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      }
    ]
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Histórico de Umidade - ${plant.nome}`
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: 'Umidade (%)'
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Dados de Umidade - {plant.nome}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {sensorData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Nenhum dado de sensor disponível para esta planta.
          </p>
        ) : (
          <div className="bg-white p-4 rounded-lg">
            <Line options={options} data={data} />
          </div>
        )}
      </div>
    </div>
  )
}