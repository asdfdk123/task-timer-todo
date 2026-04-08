import type { Todo } from '../types/todo'
import type { TodoAppState } from '../types/todoAppState'

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
    (typeof state.startedAt === 'number' || state.startedAt === null)
  )
}

export function sanitizeTodoAppState(state: TodoAppState): TodoAppState {
  const todoIds = new Set(state.todos.map((todo) => todo.id))
  const selectedTodoId =
    state.selectedTodoId !== null && todoIds.has(state.selectedTodoId)
      ? state.selectedTodoId
      : state.todos.find((todo) => !todo.completed)?.id ?? state.todos[0]?.id ?? null
  const runningTodoId =
    state.runningTodoId !== null && todoIds.has(state.runningTodoId)
      ? state.runningTodoId
      : null
  const startedAt = runningTodoId === null ? null : state.startedAt

  return {
    runningTodoId,
    selectedTodoId,
    startedAt,
    todos: state.todos,
  }
}

export function loadTodoAppState(fallbackState: TodoAppState) {
  if (typeof window === 'undefined') {
    return fallbackState
  }

  try {
    const savedState = window.localStorage.getItem(STORAGE_KEY)

    if (!savedState) {
      return fallbackState
    }

    const parsedState: unknown = JSON.parse(savedState)

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

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
