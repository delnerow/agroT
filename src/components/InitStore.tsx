import { useEffect } from 'react'
import { useCultivosStore } from '../stores/cultivos'

export function InitStore() {
  const init = useCultivosStore(state => state.init)
  
  useEffect(() => {
    init()
  }, [init])
  
  return null
}