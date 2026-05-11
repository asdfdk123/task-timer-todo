import { useEffect, useState } from 'react'
import type { TodoAppState } from '../types/todoAppState'
import { saveTodoAppState } from '../utils/todoStorage'

export function useTodoAppStorage(state: TodoAppState) {
  const [hasStorageError, setHasStorageError] = useState(false)

  useEffect(() => {
    const nextHasStorageError = !saveTodoAppState(state)
    const timerId = window.setTimeout(() => {
      setHasStorageError(nextHasStorageError)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [state])

  return {
    hasStorageError,
  }
}
