import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

// Helper to build API URLs.
// If VITE_API_URL is set, use it as a prefix (e.g. https://api.example.com).
// If VITE_API_URL is empty, map /api/* to Netlify functions path /.netlify/functions/*
const API_BASE = import.meta.env.VITE_API_URL ?? ''
const apiUrl = (path: string) => {
  if (API_BASE) return `${API_BASE}${path}`
  // If no API_BASE provided, map /api/xyz -> /.netlify/functions/xyz
  if (path.startsWith('/api/')) {
    const fnName = path.replace('/api/', '')
    return `/.netlify/functions/${fnName}`
  }
  return path
}

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
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt' | 'farmId' | 'sensorData'>) => Promise<Plant>
  removePlant: (id: string) => Promise<void>
  updatePlant: (id: string, data: Partial<Plant>) => Promise<void>
  updateFarm: (data: Partial<Farm>) => Promise<void>
  getSensorData: (plantId: string) => Promise<SensorData[]>
  addSensorData: (plantId: string, temperature: number, humidity: number) => Promise<SensorData>
  addTestData: (plantId: string) => Promise<void>
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
          console.log('Initializing store with API base:', API_BASE || '(relative)')
          const [plantsRes, farmRes] = await Promise.all([
            axios.get(apiUrl('/api/plants')),
            axios.get(apiUrl('/api/farm'))
          ])
          
          console.log('Received plants:', plantsRes.data)
          console.log('Received farm:', farmRes.data)
          
          if (Array.isArray(plantsRes.data)) {
            console.log('Setting plants in store:', plantsRes.data)
            set((state) => ({ 
              ...state,
              plants: plantsRes.data 
            }))
          } else {
            console.warn('Plants data is not an array:', plantsRes.data)
          }
          
          if (farmRes.data) {
            console.log('Setting farm in store:', farmRes.data)
            set((state) => ({
              ...state,
              farm: farmRes.data
            }))
          } else {
            // If no farm exists, create default farm
            const defaultFarm = {
              id: 'default-farm',
              areaHa: 40,
              modulosFiscais: 4,
              uf: 'SP',
              tipoSolo: 'Argiloso',
              plants: [],
              createdAt: new Date(),
              updatedAt: new Date()
            }
            const response = await axios.put(apiUrl('/api/farm'), defaultFarm)
            set({ farm: response.data })
          }
        } catch (error) {
          console.error('Error loading initial data:', error)
          if (axios.isAxiosError(error)) {
            console.error('Error response:', error.response?.data)
            console.error('Error status:', error.response?.status)
          }
          // Use default values if API call fails
          set({
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
            }
          })
        }
      },

      addPlant: async (plant) => {
        try {
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
          
          const response = await axios.post(apiUrl('/api/plants'), plantData)
          const newPlant = response.data
          
          set((state) => ({
            plants: [...state.plants, newPlant]
          }))
          return newPlant
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
          return newPlant
        }
      },

      removePlant: async (id) => {
        try {
          await axios.delete(apiUrl(`/api/plants/${id}`))
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
          const response = await axios.put(apiUrl(`/api/plants/${id}`), data)
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
          const response = await axios.put(apiUrl('/api/farm'), {
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
          const response = await axios.get(apiUrl(`/api/sensor-data/${plantId}`))
          return response.data
        } catch (error) {
          console.error('Error fetching sensor data:', error)
          return []
        }
      },

      addSensorData: async (plantId: string, temperature: number, humidity: number) => {
        try {
          const response = await axios.post(apiUrl('/api/sensor-data'), {
            plantId,
            temperature,
            humidity
          })
          return response.data
        } catch (error) {
          console.error('Error adding sensor data:', error)
          throw error
        }
      },

      // Helper function to add test data
      addTestData: async (plantId: string) => {
        try {
          // Generate 24 hours of data points (one per hour)
          const now = new Date()
          const promises = Array.from({ length: 24 }).map((_, i) => {
            const timestamp = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000)
            // Random humidity between 50% and 90%
            const humidity = 50 + Math.random() * 40
            // Random temperature between 20°C and 30°C
            const temperature = 20 + Math.random() * 10
            
            return axios.post(apiUrl('/api/sensor-data'), {
              plantId,
              temperature,
              humidity,
              timestamp
            })
          })
          
          await Promise.all(promises)
        } catch (error) {
          console.error('Error adding test data:', error)
        }
      }
    }),
    {
      name: 'cultivos-storage',
      // Only persist farm data locally
      partialize: (state) => ({ farm: state.farm }),
      version: 1
    }
  )
)