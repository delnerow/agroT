import type { FormEvent } from 'react'
import { useState } from 'react'
import { useCultivosStore } from '../stores/cultivos'

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
    <div className="space-y-6">
      <section className="card space-y-3">
        <h2 className="card-title"><span className="section-accent" /> Dados da fazenda</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">Área (hectares)
            <input type="number" className="mt-1 input" value={fazenda.areaHa}
              onChange={(e) => setFazenda({ areaHa: Number(e.target.value) })} />
          </label>
          <label className="text-sm">Módulos fiscais
            <input type="number" className="mt-1 input" value={fazenda.modulosFiscais}
              onChange={(e) => setFazenda({ modulosFiscais: Number(e.target.value) })} />
          </label>
        </div>
        <p className="text-xs text-gray-500">Padrão inicial: 40 ha (quatro módulos fiscais).</p>
      </section>

      <section className="card space-y-3">
        <h2 className="card-title"><span className="section-accent" /> Cultivos</h2>
        <form onSubmit={onAdd} className="flex gap-2">
          <input className="input flex-1" placeholder="Adicionar cultivo (ex.: Tomate)" value={novo}
            onChange={(e) => setNovo(e.target.value)} />
          <button className="btn-primary" type="submit">Adicionar</button>
        </form>
        <ul className="divide-y rounded-lg border border-brand-100 overflow-hidden">
          {cultivos.length === 0 ? (
            <li className="py-2 px-3 text-sm text-gray-500">Nenhum cultivo cadastrado.</li>
          ) : cultivos.map(c => (
            <li key={c.id} className="py-2 px-3 flex items-center justify-between">
              <span className="font-medium">{c.nome}</span>
              <button className="btn-outline" onClick={() => removeCultivo(c.id)}>Remover</button>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-gray-500">Os cultivos cadastrados serão usados na aba Mercado para buscar Preço Mínimo na CONAB.</p>
    </div>
  )
}
