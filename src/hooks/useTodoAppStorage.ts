import { useEffect, useState } from 'react'
import type { TodoAppState } from '../types/todoAppState'
import { saveTodoAppState } from '../utils/todoStorage'

export function useTodoAppStorage(state: TodoAppState) {
  const [hasStorageError, setHasStorageError] = useState(false)

  useEffect(() => {
    setHasStorageError(!saveTodoAppState(state))
  }, [state])

  return {
    hasStorageError,
  }
}
