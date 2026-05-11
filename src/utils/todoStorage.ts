import type { TimerSession } from '../types/session'
import type { Todo } from '../types/todo'
import type { TodoAppState } from '../types/todoAppState'
import { getLocalDateKey } from './time'
import { DEFAULT_TIMER_SECONDS } from './timerConfig'

const STORAGE_KEY = 'todo-timer-app-state'
export const STORAGE_SCHEMA_VERSION = 2

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function sanitizeTodoAppState(state: TodoAppState): TodoAppState {
  const currentDateKey = getLocalDateKey(Date.now())
  const todoIds = new Set(state.todos.map((todo) => todo.id))
  const selectedTodoId =
    state.selectedTodoId !== null && todoIds.has(state.selectedTodoId)
      ? state.selectedTodoId
      : state.todos.find((todo) => !todo.completed)?.id ?? state.todos[0]?.id ?? null
  const runningTodo = state.todos.find((todo) => todo.id === state.runningTodoId)
  const runningTodoId = runningTodo && !runningTodo.completed ? runningTodo.id : null
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
    schemaVersion: STORAGE_SCHEMA_VERSION,
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

function normalizeStoredTodoAppState(rawState: unknown, fallbackState: TodoAppState) {
  if (!isRecord(rawState)) {
    return fallbackState
  }

  const todos = Array.isArray(rawState.todos)
    ? rawState.todos.filter(isTodo)
    : fallbackState.todos
  const sessions = Array.isArray(rawState.sessions)
    ? rawState.sessions.filter(isTimerSession)
    : fallbackState.sessions

  return sanitizeTodoAppState({
    schemaVersion:
      typeof rawState.schemaVersion === 'number'
        ? rawState.schemaVersion
        : STORAGE_SCHEMA_VERSION,
    todos,
    sessions,
    selectedTodoId:
      typeof rawState.selectedTodoId === 'number' || rawState.selectedTodoId === null
        ? rawState.selectedTodoId
        : fallbackState.selectedTodoId,
    runningTodoId:
      typeof rawState.runningTodoId === 'number' || rawState.runningTodoId === null
        ? rawState.runningTodoId
        : fallbackState.runningTodoId,
    startedAt:
      typeof rawState.startedAt === 'number' || rawState.startedAt === null
        ? rawState.startedAt
        : fallbackState.startedAt,
    activeSessionStartedAt:
      typeof rawState.activeSessionStartedAt === 'number' ||
      rawState.activeSessionStartedAt === null
        ? rawState.activeSessionStartedAt
        : fallbackState.activeSessionStartedAt,
    timerDurationSec:
      typeof rawState.timerDurationSec === 'number'
        ? rawState.timerDurationSec
        : fallbackState.timerDurationSec,
    timerRemainingSec:
      typeof rawState.timerRemainingSec === 'number'
        ? rawState.timerRemainingSec
        : fallbackState.timerRemainingSec,
    todayFocusDateKey:
      typeof rawState.todayFocusDateKey === 'string'
        ? rawState.todayFocusDateKey
        : fallbackState.todayFocusDateKey,
    todayFocusSec:
      typeof rawState.todayFocusSec === 'number'
        ? rawState.todayFocusSec
        : fallbackState.todayFocusSec,
  })
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

    return normalizeStoredTodoAppState(parsedState, fallbackState)
  } catch {
    return fallbackState
  }
}

export function saveTodoAppState(state: TodoAppState) {
  if (typeof window === 'undefined') {
    return true
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
