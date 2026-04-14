import type { TimerSession } from '../types/session'
import type { Todo } from '../types/todo'
import type { TodoAppState } from '../types/todoAppState'
import { getLocalDateKey } from './time'

const STORAGE_KEY = 'todo-timer-app-state'
const DEFAULT_TIMER_SECONDS = 25 * 60

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

function isTimerSession(value: unknown): value is TimerSession {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const session = value as Record<string, unknown>

  return (
    typeof session.id === 'string' &&
    typeof session.date === 'string' &&
    typeof session.weekday === 'string' &&
    typeof session.durationSec === 'number' &&
    typeof session.startedAt === 'number' &&
    typeof session.completedAt === 'number' &&
    typeof session.todoId === 'number' &&
    typeof session.todoTitle === 'string'
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
    (state.sessions === undefined ||
      (Array.isArray(state.sessions) && state.sessions.every(isTimerSession))) &&
    (typeof state.selectedTodoId === 'number' || state.selectedTodoId === null) &&
    (typeof state.runningTodoId === 'number' || state.runningTodoId === null) &&
    (typeof state.startedAt === 'number' || state.startedAt === null) &&
    (typeof state.activeSessionStartedAt === 'number' ||
      state.activeSessionStartedAt === null ||
      state.activeSessionStartedAt === undefined) &&
    (typeof state.timerDurationSec === 'number' || state.timerDurationSec === undefined) &&
    (typeof state.timerRemainingSec === 'number' || state.timerRemainingSec === undefined) &&
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
  const activeSessionStartedAt =
    runningTodoId !== null && typeof state.activeSessionStartedAt === 'number'
      ? state.activeSessionStartedAt
      : startedAt
  const timerDurationSec =
    typeof state.timerDurationSec === 'number' && state.timerDurationSec > 0
      ? state.timerDurationSec
      : DEFAULT_TIMER_SECONDS
  const timerRemainingSec =
    typeof state.timerRemainingSec === 'number' && state.timerRemainingSec >= 0
      ? Math.min(state.timerRemainingSec, timerDurationSec)
      : timerDurationSec
  const todayFocusDateKey =
    state.todayFocusDateKey === currentDateKey ? state.todayFocusDateKey : currentDateKey
  const todayFocusSec = todayFocusDateKey === state.todayFocusDateKey ? state.todayFocusSec : 0

  return {
    todos: state.todos,
    sessions: Array.isArray(state.sessions) ? state.sessions.filter(isTimerSession) : [],
    selectedTodoId,
    runningTodoId,
    startedAt,
    activeSessionStartedAt,
    timerDurationSec,
    timerRemainingSec,
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
