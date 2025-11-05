  // Mapeamento de ícones para cada cultivo
  const cultivoIcons: Record<string, string> = {
    "Feijão Preto": "🌱",
    "Feijão Cores": "🌱",
    "Arroz": "🌾",
    "Mandioca": "🥔",
    "Milho": "🌽",
    "Cafe": "☕",
    "Trigo": "🌾",
    "Banana": "🍌",
    "Abacaxi": "🍍"
  }
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useCultivosStore } from '../stores/cultivos'
import MapaLocalizacao from './MapaLocalizacao'

const ufs = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

const cultivosDisponiveis = ["Feijão Preto","Feijão Cores", "Arroz", "Mandioca", "Milho", "Cafe", "Trigo", "Banana", "Abacaxi"] as const
const estagios = ["Germinacao", "Vegetativo", "Florescimento", "Maturacao"] as const
const tiposSolo = ["Arenoso", "Argiloso", "Silte"] as const

export default function Cultivos() {
  const { plants, farm, addPlant, removePlant, updateFarm, updatePlant } = useCultivosStore()
  
  // Estado para nova planta
  const [novoTipoPlanta, setNovoTipoPlanta] = useState<typeof cultivosDisponiveis[number]>("Feijão Preto")
  const [novoEstagio, setNovoEstagio] = useState<typeof estagios[number]>("Germinacao")
  const [novoArea, setNovoArea] = useState(0)
  const [novoCusto, setNovoCusto] = useState(0)
  const [novaReceita, setNovaReceita] = useState(0)
  const [novoTipoSolo] = useState<typeof tiposSolo[number]>(farm.tipoSolo || "Arenoso")

  async function onAdd(e: FormEvent) {
    e.preventDefault()  
    await addPlant({
      nome: novoTipoPlanta,
      tipoPlanta: novoTipoPlanta,
      estagioAtual: novoEstagio,
      areaHa: novoArea,
      custoSafraAnterior: novoCusto,
      receitaSafraAnterior: novaReceita,
      tipoSolo: novoTipoSolo
    })
    // reset campos
    setNovoArea(0)
    setNovoCusto(0)
    setNovaReceita(0)
  }

  return (
    <div className="space-y-8">
      {/* Dados da Fazenda */}
      <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Dados da propriedade</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="grid grid-cols-2 gap-4 col-span-2">
            <label className="text-sm text-gray-600">Área (hectares)
              <input type="number" className="mt-1 input-light-blue" value={farm.areaHa}
                onChange={(e) => updateFarm({ areaHa: Number(e.target.value) })} />
            </label>
            <label className="text-sm text-gray-600">Módulos fiscais
              <input type="number" className="mt-1 input-light-blue" value={farm.modulosFiscais}
                onChange={(e) => updateFarm({ modulosFiscais: Number(e.target.value) })} />
            </label>
            <label className="text-sm text-gray-600">UF
              <select className="mt-1 input-light-blue" value={farm.uf}
                onChange={(e) => updateFarm({ uf: e.target.value })}>
                {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </label>
            <label className="text-sm text-gray-600">Tipo de solo
              <select className="mt-1 input-light-blue" value={farm.tipoSolo}
                onChange={(e) => updateFarm({ tipoSolo: e.target.value as typeof tiposSolo[number] })}>
                {tiposSolo.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <div>
            <h3 className="text-sm text-gray-600 mb-2">Localização no mapa</h3>
            <MapaLocalizacao />
            {farm.localizacao && (
              <p className="text-xs text-gray-500 mt-2">
                Latitude: {farm.localizacao.lat.toFixed(5)} | Longitude: {farm.localizacao.lng.toFixed(5)}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 pt-2">Padrão inicial: 40 ha (quatro módulos fiscais).</p>
      </section>

      {/* Cultivos */}
      <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Cultivos</h2>
        <form onSubmit={onAdd} className="grid sm:grid-cols-2 gap-2">
          <label>
            Planta
            <select className="input-light-blue mt-1" value={novoTipoPlanta} onChange={e => setNovoTipoPlanta(e.target.value as typeof cultivosDisponiveis[number])}>
              {cultivosDisponiveis.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>
            Estágio
            <select className="input-light-blue mt-1" value={novoEstagio} onChange={e => setNovoEstagio(e.target.value as typeof estagios[number])}>
              {estagios.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label>
            Área (ha)
            <input type="number" className="input-light-blue mt-1" value={novoArea} onChange={e => setNovoArea(Number(e.target.value))}/>
          </label>
          <label>
            Custo safra anterior
            <input type="number" className="input-light-blue mt-1" value={novoCusto} onChange={e => setNovoCusto(Number(e.target.value))}/>
          </label>
          <label>
            Receita safra anterior
            <input type="number" className="input-light-blue mt-1" value={novaReceita} onChange={e => setNovaReceita(Number(e.target.value))}/>
          </label>
          <button className="btn btn-grass mt-2 col-span-2" type="submit">Adicionar Cultivo</button>
        </form>

        <ul className="space-y-2">
          {plants.length === 0 ? (
            <li className="py-3 px-4 text-sm text-gray-500 text-center bg-gray-50 rounded-md">Nenhum cultivo cadastrado.</li>
          ) : plants.map(c => (
            <li key={c.id} className="py-3 px-4 flex flex-col bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700 flex items-center gap-2">
                  <span>{cultivoIcons[c.nome] || "🌱"}</span>
                  {c.nome}
                </span>
                <button className="btn btn-sky-outline text-xs" onClick={() => removePlant(c.id)}>Remover</button>
              </div>

              <div className="grid sm:grid-cols-4 gap-2 text-sm">
                <label>
                  Área (ha)
                  <input type="number" className="input-light-blue mt-1" value={c.areaHa}
                    onChange={(e) => updatePlant(c.id, { areaHa: Number(e.target.value) })} />
                </label>
                <label>
                  Estágio
                  <select className="input-light-blue mt-1" value={c.estagioAtual}
                    onChange={e => updatePlant(c.id, { estagioAtual: e.target.value as typeof estagios[number] })}>
                    {estagios.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Custo safra anterior
                  <input type="number" className="input-light-blue mt-1" value={c.custoSafraAnterior}
                    onChange={(e) => updatePlant(c.id, { custoSafraAnterior: Number(e.target.value) })} />
                </label>
                <label>
                  Receita safra anterior
                  <input type="number" className="input-light-blue mt-1" value={c.receitaSafraAnterior}
                    onChange={(e) => updatePlant(c.id, { receitaSafraAnterior: Number(e.target.value) })} />
                </label>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-gray-400 text-center">Os cultivos cadastrados serão usados nas abas Mercado e Irrigação.</p>
    </div>
  )
}
