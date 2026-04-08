import { useEffect } from 'react'
import type { TodoAppState } from '../types/todoAppState'
import { saveTodoAppState } from '../utils/todoStorage'

export function useTodoAppStorage(state: TodoAppState) {
  useEffect(() => {
    saveTodoAppState(state)
  }, [state])
}
