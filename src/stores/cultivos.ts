import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

export type SensorData = {
  id: string
  plantId: string
  temperature: number
  humidity: number
  timestamp: Date
}

export type Plant = {
  id: string
  nome: string
  tipoPlanta: "Feijão Preto" | "Feijão Cores" | 'Arroz' | 'Mandioca' | 'Milho' | 'Cafe' | 'Trigo' | 'Banana' | 'Abacaxi'
  estagioAtual: 'Germinacao' | 'Vegetativo' | 'Florescimento' | 'Maturacao'
  tipoSolo: 'Arenoso' | 'Argiloso' | 'Silte'
  areaHa: number
  custoSafraAnterior: number
  receitaSafraAnterior: number
  farmId: string
  sensorData?: SensorData[]
  createdAt: Date
  updatedAt: Date
}

export type Farm = {
  id: string
  areaHa: number
  modulosFiscais: number
  uf: string
  tipoSolo: 'Arenoso' | 'Argiloso' | 'Silte'
  lat?: number
  lng?: number
  plants: Plant[]
  createdAt: Date
  updatedAt: Date
  localizacao?: { lat: number; lng: number }
}

type Store = {
  plants: Plant[]
  farm: Farm
  init: () => Promise<void>
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt' | 'farmId' | 'sensorData'>) => Promise<void>
  removePlant: (id: string) => Promise<void>
  updatePlant: (id: string, data: Partial<Plant>) => Promise<void>
  updateFarm: (data: Partial<Farm>) => Promise<void>
  getSensorData: (plantId: string) => Promise<SensorData[]>
  addSensorData: (plantId: string, temperature: number, humidity: number) => Promise<SensorData>
}

// Map of ideal humidity by plant type and growth stage
const umidadeIdealMap = {
  'Feijão Preto': { Germinacao: 75, Vegetativo: 65, Florescimento: 75, Maturacao: 60 },
  'Feijão Cores': { Germinacao: 75, Vegetativo: 65, Florescimento: 75, Maturacao: 60 },
  Arroz: { Germinacao: 95, Vegetativo: 95, Florescimento: 95, Maturacao: 75 },
  Mandioca: { Germinacao: 70, Vegetativo: 65, Florescimento: 65, Maturacao: 60 },
  Milho: { Germinacao: 75, Vegetativo: 70, Florescimento: 80, Maturacao: 65 },
  Cafe: { Germinacao: 75, Vegetativo: 70, Florescimento: 75, Maturacao: 65 },
  Trigo: { Germinacao: 75, Vegetativo: 70, Florescimento: 80, Maturacao: 65 },
  Banana: { Germinacao: 80, Vegetativo: 75, Florescimento: 80, Maturacao: 75 },
  Abacaxi: { Germinacao: 70, Vegetativo: 65, Florescimento: 70, Maturacao: 65 },
} as const;

// Helper function to get ideal humidity for a plant
export const getIdealHumidity = (
  tipoPlanta: Plant['tipoPlanta'], 
  estagioAtual: Plant['estagioAtual']
): number => {
  return umidadeIdealMap[tipoPlanta][estagioAtual]
}

export const useCultivosStore = create<Store>()(
  persist(
    (set, get) => ({
      plants: [],
      farm: {
        id: 'default-farm',
        areaHa: 40,
        modulosFiscais: 4,
        uf: 'SP',
        tipoSolo: 'Argiloso',
        plants: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // Load initial data on store creation
      init: async () => {
        try {
          const [plantsRes, farmRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/plants`),
            axios.get(`${import.meta.env.VITE_API_URL}/api/farm`)
          ])
          
          if (plantsRes.data) {
            set({ plants: plantsRes.data })
          }
          
          if (farmRes.data) {
            set({ farm: farmRes.data })
          }
        } catch (error) {
          console.error('Error loading initial data:', error)
        }
      },

      addPlant: async (plant) => {
        try {
          console.log('Sending plant data:', {
            ...plant,
            farmId: get().farm.id
          })
          
          // Format the data according to the Prisma schema
          const plantData = {
            nome: plant.nome,
            tipoPlanta: plant.tipoPlanta,
            estagioAtual: plant.estagioAtual,
            tipoSolo: plant.tipoSolo,
            areaHa: Number(plant.areaHa),
            custoSafraAnterior: Number(plant.custoSafraAnterior),
            receitaSafraAnterior: Number(plant.receitaSafraAnterior),
            farmId: get().farm.id
          }
          
          console.log('Sending formatted plant data:', plantData)
          const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/plants`, plantData)
          
          console.log('Server response:', response.data)
          
          set((state) => ({
            plants: [...state.plants, response.data]
          }))
        } catch (error) {
          console.error('Error adding plant:', error)
          if (axios.isAxiosError(error)) {
            console.error('Error response:', error.response?.data)
            console.error('Error status:', error.response?.status)
          }
          
          // Fallback to local storage if API fails
          const newPlant = {
            ...plant,
            id: Math.random().toString(36).substr(2, 9),
            farmId: get().farm.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            sensorData: []
          }
          set((state) => ({
            plants: [...state.plants, newPlant]
          }))
        }
      },

      removePlant: async (id) => {
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/plants/${id}`)
          set((state) => ({
            plants: state.plants.filter((p) => p.id !== id)
          }))
        } catch (error) {
          console.error('Error removing plant:', error)
          // Fallback to local storage if API fails
          set((state) => ({
            plants: state.plants.filter((p) => p.id !== id)
          }))
        }
      },

      updatePlant: async (id, data) => {
        try {
          const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/plants/${id}`, data)
          set((state) => ({
            plants: state.plants.map((p) => 
              p.id === id ? response.data : p
            )
          }))
        } catch (error) {
          console.error('Error updating plant:', error)
          // Fallback to local storage if API fails
          set((state) => ({
            plants: state.plants.map((p) => 
              p.id === id ? { ...p, ...data, updatedAt: new Date() } : p
            )
          }))
        }
      },

      updateFarm: async (data) => {
        try {
          const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/farm`, {
            id: get().farm.id,
            ...data
          })
          set({ farm: response.data })
        } catch (error) {
          console.error('Error updating farm:', error)
          // Fallback to local storage if API fails
          set((state) => ({ 
            farm: { 
              ...state.farm, 
              ...data,
              updatedAt: new Date() 
            } 
          }))
        }
      },

      getSensorData: async (plantId) => {
        try {
          const response = await axios.get(`/api/sensor-data/${plantId}`)
          return response.data
        } catch (error) {
          console.error('Error fetching sensor data:', error)
          return []
        }
      },

      addSensorData: async (plantId, temperature, humidity) => {
        try {
          const response = await axios.post('/api/sensor-data', {
            plantId,
            temperature,
            humidity
          })
          return response.data
        } catch (error) {
          console.error('Error adding sensor data:', error)
          throw error
        }
      }
    }),
    {
      name: 'cultivos-storage',
      // Persist both farm and plants data locally
      partialize: (state) => ({ farm: state.farm, plants: state.plants })
    }
  )
)