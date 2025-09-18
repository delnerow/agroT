import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Cultivo = {
  id: string
  nome: string
  tipoPlanta: "Feijão Preto" | "Feijão Cores" | 'Arroz' | 'Mandioca' | 'Milho' | 'Cafe' | 'Trigo' | 'Banana' | 'Abacaxi'
  estagioAtual: 'Germinacao' | 'Vegetativo' | 'Florescimento' | 'Maturacao'
  tipoSolo: 'Arenoso' | 'Argiloso' | 'Silte'
  areaHa: number
  custoSafraAnterior: number
  receitaSafraAnterior: number
  umidadeNecessaria: number
}

type Fazenda = {
  areaHa: number
  modulosFiscais: number
  uf: string
  tipoSolo: 'Arenoso' | 'Argiloso' | 'Silte'
  localizacao?: { lat: number; lng: number }
}

type State = {
  cultivos: Cultivo[]
  fazenda: Fazenda
  addCultivo: (c: {
    nome: string
    tipoPlanta: Cultivo['tipoPlanta']
    estagioAtual: Cultivo['estagioAtual']
    tipoSolo: Fazenda['tipoSolo']
    areaHa: number
    custoSafraAnterior: number
    receitaSafraAnterior: number
  }) => void
  removeCultivo: (id: string) => void
  updateCultivo: (id: string, data: Partial<Cultivo>) => void
  setFazenda: (data: Partial<Fazenda>) => void
}

let nextId = 1

// Mapa de umidade ideal
const umidadeIdeal: Record<
  Cultivo['tipoPlanta'],
  Record<Cultivo['estagioAtual'], number>
> = {
  'Feijão Preto': { Germinacao: 75, Vegetativo: 65, Florescimento: 75, Maturacao: 60 },
  'Feijão Cores': { Germinacao: 75, Vegetativo: 65, Florescimento: 75, Maturacao: 60 },
  Arroz: { Germinacao: 95, Vegetativo: 95, Florescimento: 95, Maturacao: 75 },
  Mandioca: { Germinacao: 70, Vegetativo: 65, Florescimento: 65, Maturacao: 60 },
  Milho: { Germinacao: 75, Vegetativo: 70, Florescimento: 80, Maturacao: 65 },
  Cafe: { Germinacao: 75, Vegetativo: 70, Florescimento: 75, Maturacao: 65 },
  Trigo: { Germinacao: 75, Vegetativo: 70, Florescimento: 80, Maturacao: 65 },
  Banana: { Germinacao: 80, Vegetativo: 75, Florescimento: 80, Maturacao: 75 },
  Abacaxi: { Germinacao: 70, Vegetativo: 65, Florescimento: 70, Maturacao: 65 },
}

export const useCultivosStore = create<State>()(
  persist(
    (set) => ({
      cultivos: [],
      fazenda: { areaHa: 40, modulosFiscais: 4, uf: 'SP', tipoSolo: 'Arenoso' },

      addCultivo: ({ nome, tipoPlanta, estagioAtual, tipoSolo, areaHa, custoSafraAnterior, receitaSafraAnterior }) =>
        set((s) => ({
          cultivos: [
            ...s.cultivos,
            {
              id: String(nextId++),
              nome,
              tipoPlanta,
              estagioAtual,
              tipoSolo,
              areaHa,
              custoSafraAnterior,
              receitaSafraAnterior,
              umidadeNecessaria: umidadeIdeal[tipoPlanta][estagioAtual],
            },
          ],
        })),

      removeCultivo: (id) => set(state => ({
  cultivos: state.cultivos.filter(c => c.id !== id)
})),

      updateCultivo: (id, data) =>
        set((s) => ({
          cultivos: s.cultivos.map((c) =>
            c.id === id
              ? {
                  ...c,
                  ...data,
                  // Atualiza a umidade se tipoPlanta ou estagioAtual mudarem
                  umidadeNecessaria:
                    data.tipoPlanta || data.estagioAtual
                      ? umidadeIdeal[data.tipoPlanta ?? c.tipoPlanta][
                          data.estagioAtual ?? c.estagioAtual
                        ]
                      : c.umidadeNecessaria,
                }
              : c
          ),
        })),

      setFazenda: (data) =>
        set((s) => ({ fazenda: { ...s.fazenda, ...data } })),
    }),
    { name: 'agrot-cultivos' }
  )
)
