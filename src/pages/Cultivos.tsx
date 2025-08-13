import type { FormEvent } from 'react'
import { useState } from 'react'
import { useCultivosStore } from '../stores/cultivos'

const ufs = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

export default function Cultivos() {
  const { cultivos, fazenda, addCultivo, removeCultivo, setFazenda } = useCultivosStore()
  const [novo, setNovo] = useState('')

  function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!novo.trim()) return
    addCultivo(novo.trim())
    setNovo('')
  }

  return (
    <div className="space-y-8">
      <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Dados da fazenda</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="text-sm text-gray-600">Área (hectares)
            <input type="number" className="mt-1 input-light-blue" value={fazenda.areaHa}
              onChange={(e) => setFazenda({ areaHa: Number(e.target.value) })} />
          </label>
          <label className="text-sm text-gray-600">Módulos fiscais
            <input type="number" className="mt-1 input-light-blue" value={fazenda.modulosFiscais}
              onChange={(e) => setFazenda({ modulosFiscais: Number(e.target.value) })} />
          </label>
          <label className="text-sm text-gray-600">UF
            <select className="mt-1 input-light-blue" value={fazenda.uf}
              onChange={(e) => setFazenda({ uf: e.target.value })}>
              {ufs.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </label>
        </div>
        <p className="text-xs text-gray-400 pt-2">Padrão inicial: 40 ha (quatro módulos fiscais).</p>
      </section>

      <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">Cultivos</h2>
        <form onSubmit={onAdd} className="flex gap-2">
          <input className="input-light-blue flex-1" placeholder="Adicionar cultivo (ex.: Tomate)" value={novo}
            onChange={(e) => setNovo(e.target.value)} />
          <button className="btn btn-grass" type="submit">Adicionar</button>
        </form>
        <ul className="space-y-2">
          {cultivos.length === 0 ? (
            <li className="py-3 px-4 text-sm text-gray-500 text-center bg-gray-50 rounded-md">Nenhum cultivo cadastrado.</li>
          ) : cultivos.map(c => (
            <li key={c.id} className="py-3 px-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-200">
              <span className="font-medium text-gray-700">{c.nome}</span>
              <button className="btn btn-sky-outline text-xs" onClick={() => removeCultivo(c.id)}>Remover</button>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-gray-400 text-center">Os cultivos cadastrados serão usados nas abas Mercado e Irrigação.</p>
    </div>
  )
}
