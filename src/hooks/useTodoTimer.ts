import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Todo } from '../types/todo'
import { getLocalDateKey, getTodayElapsedSeconds } from '../utils/time'

type UseTodoTimerParams = {
  initialRunningTodoId: number | null
  initialStartedAt: number | null
  initialTodayFocusDateKey: string
  initialTodayFocusSec: number
  selectedTodoId: number | null
  setSelectedTodoId: Dispatch<SetStateAction<number | null>>
  setTodos: Dispatch<SetStateAction<Todo[]>>
  todos: Todo[]
}

function calculateElapsedSeconds(baseSeconds: number, startedAt: number | null, now: number) {
  if (startedAt === null) {
    return baseSeconds
  }

  const additionalSeconds = Math.max(0, Math.floor((now - startedAt) / 1000))
  return baseSeconds + additionalSeconds
}

export function useTodoTimer({
  initialRunningTodoId,
  initialStartedAt,
  initialTodayFocusDateKey,
  initialTodayFocusSec,
  selectedTodoId,
  setSelectedTodoId,
  setTodos,
  todos,
}: UseTodoTimerParams) {
  const currentDateKey = getLocalDateKey(Date.now())
  const [runningTodoId, setRunningTodoId] = useState<number | null>(initialRunningTodoId)
  const [startedAt, setStartedAt] = useState<number | null>(initialStartedAt)
  const [todayFocusDateKey, setTodayFocusDateKey] = useState(
    initialTodayFocusDateKey === currentDateKey ? initialTodayFocusDateKey : currentDateKey,
  )
  const [todayFocusSec, setTodayFocusSec] = useState(
    initialTodayFocusDateKey === currentDateKey ? initialTodayFocusSec : 0,
  )
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const nextDateKey = getLocalDateKey(now)

    if (todayFocusDateKey === nextDateKey) {
      return
    }

    setTodayFocusDateKey(nextDateKey)
    setTodayFocusSec(0)
  }, [now, todayFocusDateKey])

  useEffect(() => {
    if (runningTodoId === null || startedAt === null) {
      return
    }

    const timerId = window.setInterval(() => {
      setNow(Date.now())
    }, 250)

    return () => {
      window.clearInterval(timerId)
    }
  }, [runningTodoId, startedAt])

  const commitRunningTime = (targetTodoId: number) => {
    if (runningTodoId !== targetTodoId || startedAt === null) {
      return
    }

    const commitTime = Date.now()
    const elapsedSeconds = calculateElapsedSeconds(0, startedAt, commitTime)
    const nextDateKey = getLocalDateKey(commitTime)
    const todayElapsedSeconds = getTodayElapsedSeconds(startedAt, commitTime)

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === targetTodoId
          ? {
              ...todo,
              totalElapsedSec: todo.totalElapsedSec + elapsedSeconds,
            }
          : todo,
      ),
    )
    setTodayFocusDateKey(nextDateKey)
    setTodayFocusSec((currentFocusSec) =>
      (todayFocusDateKey === nextDateKey ? currentFocusSec : 0) + todayElapsedSeconds,
    )

    setStartedAt(null)
    setNow(commitTime)
  }

  const displayedElapsedById = Object.fromEntries(
    todos.map((todo) => {
      const displayedElapsed =
        todo.id === runningTodoId
          ? calculateElapsedSeconds(todo.totalElapsedSec, startedAt, now)
          : todo.totalElapsedSec

      return [todo.id, displayedElapsed]
    }),
  ) as Record<number, number>

  const displayedTodayFocusSec =
    runningTodoId !== null && startedAt !== null
      ? (todayFocusDateKey === getLocalDateKey(now) ? todayFocusSec : 0) +
        getTodayElapsedSeconds(startedAt, now)
      : todayFocusDateKey === getLocalDateKey(now)
        ? todayFocusSec
        : 0

  const handleStartTimer = () => {
    if (selectedTodoId === null) {
      return
    }

    if (runningTodoId !== null && runningTodoId !== selectedTodoId) {
      commitRunningTime(runningTodoId)
    }

    if (runningTodoId === selectedTodoId) {
      return
    }

    setRunningTodoId(selectedTodoId)
    setSelectedTodoId(selectedTodoId)
    setStartedAt(Date.now())
    setNow(Date.now())
  }

  const handlePauseTimer = () => {
    if (runningTodoId === null) {
      return
    }

    commitRunningTime(runningTodoId)
    setRunningTodoId(null)
  }

  const handleStopTimer = () => {
    if (runningTodoId === null) {
      return
    }

    commitRunningTime(runningTodoId)
    setRunningTodoId(null)
  }

  const handleRemoveTimerTarget = (todoId: number) => {
    if (runningTodoId === todoId) {
      setRunningTodoId(null)
      setStartedAt(null)
    }
  }

  const handleCompleteTimerTarget = (todoId: number) => {
    if (runningTodoId !== todoId) {
      return
    }

    commitRunningTime(todoId)
    setRunningTodoId(null)
  }

  return {
    displayedElapsedById,
    displayedTodayFocusSec,
    handleCompleteTimerTarget,
    handlePauseTimer,
    handleRemoveTimerTarget,
    handleStartTimer,
    handleStopTimer,
    runningTodoId,
    startedAt,
    todayFocusDateKey,
    todayFocusSec,
  }
}
