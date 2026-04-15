import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { TimerSession } from '../types/session'
import type { Todo } from '../types/todo'
import { trackEvent } from '../utils/analytics'
import { createTimerSession } from '../utils/sessions'
import { getLocalDateKey, getTodayElapsedSeconds } from '../utils/time'
import { DEFAULT_TIMER_SECONDS } from '../utils/timerConfig'

type UseTodoTimerParams = {
  initialActiveSessionStartedAt: number | null
  initialRunningTodoId: number | null
  initialStartedAt: number | null
  initialTimerDurationSec: number
  initialTimerRemainingSec: number
  initialTodayFocusDateKey: string
  initialTodayFocusSec: number
  selectedTodoId: number | null
  setSelectedTodoId: Dispatch<SetStateAction<number | null>>
  setSessions: Dispatch<SetStateAction<TimerSession[]>>
  setTodos: Dispatch<SetStateAction<Todo[]>>
  todos: Todo[]
}

function getElapsedSinceStart(startedAt: number | null, now: number) {
  if (startedAt === null) {
    return 0
  }

  return Math.max(0, Math.floor((now - startedAt) / 1000))
}

export function useTodoTimer({
  initialActiveSessionStartedAt,
  initialRunningTodoId,
  initialStartedAt,
  initialTimerDurationSec,
  initialTimerRemainingSec,
  initialTodayFocusDateKey,
  initialTodayFocusSec,
  selectedTodoId,
  setSelectedTodoId,
  setSessions,
  setTodos,
  todos,
}: UseTodoTimerParams) {
  const currentDateKey = getLocalDateKey(Date.now())
  const [runningTodoId, setRunningTodoId] = useState<number | null>(initialRunningTodoId)
  const [startedAt, setStartedAt] = useState<number | null>(initialStartedAt)
  const [activeSessionStartedAt, setActiveSessionStartedAt] = useState<number | null>(
    initialActiveSessionStartedAt,
  )
  const [timerDurationSec, setTimerDurationSec] = useState(
    initialTimerDurationSec > 0 ? initialTimerDurationSec : DEFAULT_TIMER_SECONDS,
  )
  const [timerRemainingSec, setTimerRemainingSec] = useState(
    initialTimerRemainingSec >= 0 ? initialTimerRemainingSec : DEFAULT_TIMER_SECONDS,
  )
  const [todayFocusDateKey, setTodayFocusDateKey] = useState(
    initialTodayFocusDateKey === currentDateKey ? initialTodayFocusDateKey : currentDateKey,
  )
  const [todayFocusSec, setTodayFocusSec] = useState(
    initialTodayFocusDateKey === currentDateKey ? initialTodayFocusSec : 0,
  )
  const [now, setNow] = useState(() => Date.now())

  const elapsedSinceStart = getElapsedSinceStart(startedAt, now)
  const activeRunElapsedSec =
    runningTodoId !== null && startedAt !== null
      ? Math.min(timerRemainingSec, elapsedSinceStart)
      : 0
  const displayedRemainingSec =
    runningTodoId !== null && startedAt !== null
      ? Math.max(0, timerRemainingSec - activeRunElapsedSec)
      : timerRemainingSec

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

  const commitRunningTime = (targetTodoId: number, shouldCreateSession = false) => {
    if (runningTodoId !== targetTodoId || startedAt === null) {
      return 0
    }

    const commitTime = Date.now()
    const targetTodo = todos.find((todo) => todo.id === targetTodoId)
    const elapsedSeconds = Math.min(
      timerRemainingSec,
      getElapsedSinceStart(startedAt, commitTime),
    )
    const nextDateKey = getLocalDateKey(commitTime)
    const todayElapsedSeconds = Math.min(
      elapsedSeconds,
      getTodayElapsedSeconds(startedAt, commitTime),
    )

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

    if (shouldCreateSession && targetTodo && activeSessionStartedAt !== null) {
      const completedSession = createTimerSession({
        completedAt: commitTime,
        durationSec: timerDurationSec,
        startedAt: activeSessionStartedAt,
        todo: targetTodo,
      })

      setSessions((currentSessions) => [completedSession, ...currentSessions])
      trackEvent('timer_completed', {
        durationMinutes: Math.round(timerDurationSec / 60),
        todoId: targetTodo.id,
      })
    }

    setTimerRemainingSec(Math.max(0, timerRemainingSec - elapsedSeconds))
    setStartedAt(null)
    setActiveSessionStartedAt(shouldCreateSession ? null : activeSessionStartedAt)
    setNow(commitTime)

    return elapsedSeconds
  }

  useEffect(() => {
    if (runningTodoId === null || startedAt === null || displayedRemainingSec > 0) {
      return
    }

    commitRunningTime(runningTodoId, true)
    setRunningTodoId(null)
  }, [displayedRemainingSec, runningTodoId, startedAt])

  const displayedElapsedById = Object.fromEntries(
    todos.map((todo) => {
      const displayedElapsed =
        todo.id === runningTodoId ? todo.totalElapsedSec + activeRunElapsedSec : todo.totalElapsedSec

      return [todo.id, displayedElapsed]
    }),
  ) as Record<number, number>

  const displayedTodayFocusSec =
    runningTodoId !== null && startedAt !== null
      ? (todayFocusDateKey === getLocalDateKey(now) ? todayFocusSec : 0) +
        Math.min(activeRunElapsedSec, getTodayElapsedSeconds(startedAt, now))
      : todayFocusDateKey === getLocalDateKey(now)
        ? todayFocusSec
        : 0

  const handleTimerDurationChange = (durationSeconds: number) => {
    if (runningTodoId !== null) {
      return
    }

    setTimerDurationSec(durationSeconds)
    setTimerRemainingSec(durationSeconds)
  }

  const handleStartTimer = () => {
    if (selectedTodoId === null) {
      return
    }

    const selectedTodo = todos.find((todo) => todo.id === selectedTodoId)

    if (!selectedTodo || selectedTodo.completed) {
      return
    }

    if (runningTodoId !== null && runningTodoId !== selectedTodoId) {
      commitRunningTime(runningTodoId)
    }

    if (runningTodoId === selectedTodoId) {
      return
    }

    const nextRemainingSec = timerRemainingSec > 0 ? timerRemainingSec : timerDurationSec
    const startTime = Date.now()

    setTimerRemainingSec(nextRemainingSec)
    setRunningTodoId(selectedTodoId)
    setSelectedTodoId(selectedTodoId)
    setStartedAt(startTime)
    setActiveSessionStartedAt(activeSessionStartedAt ?? startTime)
    setNow(startTime)
  }

  const handlePauseTimer = () => {
    if (runningTodoId === null) {
      return
    }

    commitRunningTime(runningTodoId)
    setRunningTodoId(null)
  }

  const handleResetTimer = () => {
    if (runningTodoId !== null) {
      commitRunningTime(runningTodoId)
      setRunningTodoId(null)
    }

    setTimerRemainingSec(timerDurationSec)
    setStartedAt(null)
    setActiveSessionStartedAt(null)
    setNow(Date.now())
  }

  const handleRemoveTimerTarget = (todoId: number) => {
    if (runningTodoId === todoId) {
      setRunningTodoId(null)
      setStartedAt(null)
      setActiveSessionStartedAt(null)
    }
  }

  const handleCompleteTimerTarget = (todoId: number) => {
    if (runningTodoId !== todoId) {
      return
    }

    commitRunningTime(todoId)
    setRunningTodoId(null)
    setActiveSessionStartedAt(null)
  }

  return {
    activeRunElapsedSec,
    activeSessionStartedAt,
    displayedElapsedById,
    displayedRemainingSec,
    displayedTodayFocusSec,
    handleCompleteTimerTarget,
    handlePauseTimer,
    handleRemoveTimerTarget,
    handleResetTimer,
    handleStartTimer,
    handleTimerDurationChange,
    runningTodoId,
    startedAt,
    timerDurationSec,
    timerRemainingSec,
    todayFocusDateKey,
    todayFocusSec,
  }
}
