import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Cultivo = {
  id: string
  nome: string
}

export type Fazenda = {
  areaHa: number
  modulosFiscais: number
}

type State = {
  cultivos: Cultivo[]
  fazenda: Fazenda
  addCultivo: (nome: string) => void
  removeCultivo: (id: string) => void
  setFazenda: (data: Partial<Fazenda>) => void
}

let nextId = 1

export const useCultivosStore = create<State>()(
  persist(
    (set) => ({
      cultivos: [],
      fazenda: { areaHa: 40, modulosFiscais: 4 },
      addCultivo: (nome) =>
        set((s) => ({
          cultivos: [...s.cultivos, { id: String(nextId++), nome }],
        })),
      removeCultivo: (id) =>
        set((s) => ({ cultivos: s.cultivos.filter((c) => c.id !== id) })),
      setFazenda: (data) =>
        set((s) => ({ fazenda: { ...s.fazenda, ...data } })),
    }),
    { name: 'agrot-cultivos' }
  )
)
