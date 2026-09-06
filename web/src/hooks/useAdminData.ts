import { useState, useEffect } from 'react'
import { adminService } from '../services/adminService'

export function useAdminData<T>(selector: () => T): T {
  const [data, setData] = useState<T>(() => selector())

  useEffect(() => {
    // Sync initial state
    setData(selector())

    // Subscribe to store mutations
    const unsubscribe = adminService.subscribe(() => {
      setData(selector())
    })

    return () => {
      unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return data
}
