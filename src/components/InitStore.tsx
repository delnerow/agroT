import { useEffect, useState } from 'react'
import { useCultivosStore } from '../stores/cultivos'

export function InitStore() {
  useEffect(() => {
    // Clear persisted store data
    localStorage.removeItem('cultivos-storage')
  }, [])
  const init = useCultivosStore(state => state.init)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('InitStore: Starting initialization...')
        await init()
        console.log('InitStore: Initialization complete')
        setIsLoading(false)
      } catch (err) {
        console.error('InitStore: Error during initialization:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setIsLoading(false)
      }
    }
    
    loadData()
  }, [init])
  
  if (error) {
    console.error('InitStore render error:', error)
  }
  
  return null
}