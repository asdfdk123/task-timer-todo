import type { Todo } from '../types/todo'
import type { TodoAppState } from '../types/todoAppState'
import { getLocalDateKey } from './time'

const STORAGE_KEY = 'todo-timer-app-state'

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const todo = value as Record<string, unknown>

  return (
    typeof todo.id === 'number' &&
    typeof todo.title === 'string' &&
    typeof todo.completed === 'boolean' &&
    typeof todo.totalElapsedSec === 'number'
  )
}

function isTodoAppState(value: unknown): value is TodoAppState {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const state = value as Record<string, unknown>

  return (
    Array.isArray(state.todos) &&
    state.todos.every(isTodo) &&
    (typeof state.selectedTodoId === 'number' || state.selectedTodoId === null) &&
    (typeof state.runningTodoId === 'number' || state.runningTodoId === null) &&
    (typeof state.startedAt === 'number' || state.startedAt === null) &&
    typeof state.todayFocusDateKey === 'string' &&
    typeof state.todayFocusSec === 'number'
  )
}

export function sanitizeTodoAppState(state: TodoAppState): TodoAppState {
  const currentDateKey = getLocalDateKey(Date.now())
  const todoIds = new Set(state.todos.map((todo) => todo.id))
  const selectedTodoId =
    state.selectedTodoId !== null && todoIds.has(state.selectedTodoId)
      ? state.selectedTodoId
      : state.todos.find((todo) => !todo.completed)?.id ?? state.todos[0]?.id ?? null
  const runningTodoId =
    state.runningTodoId !== null && todoIds.has(state.runningTodoId)
      ? state.runningTodoId
      : null
  const startedAt =
    runningTodoId !== null && typeof state.startedAt === 'number' ? state.startedAt : null
  const todayFocusDateKey =
    state.todayFocusDateKey === currentDateKey ? state.todayFocusDateKey : currentDateKey
  const todayFocusSec = todayFocusDateKey === state.todayFocusDateKey ? state.todayFocusSec : 0

  return {
    todos: state.todos,
    selectedTodoId,
    runningTodoId,
    startedAt,
    todayFocusDateKey,
    todayFocusSec,
  }
}

export function loadTodoAppState(fallbackState: TodoAppState) {
  if (typeof window === 'undefined') {
    return fallbackState
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY)

    if (!rawState) {
      return fallbackState
    }

    const parsedState: unknown = JSON.parse(rawState)

    if (!isTodoAppState(parsedState)) {
      return fallbackState
    }

    return sanitizeTodoAppState(parsedState)
  } catch {
    return fallbackState
  }
}

export function saveTodoAppState(state: TodoAppState) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    return
  }
}
