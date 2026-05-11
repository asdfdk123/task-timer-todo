import { useCallback, useEffect, useRef, useState } from 'react'
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
  onTimerCompleted?: (details: {
    durationSec: number
    todoId: number
    todoTitle: string
  }) => void
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
  onTimerCompleted,
  selectedTodoId,
  setSelectedTodoId,
  setSessions,
  setTodos,
  todos,
}: UseTodoTimerParams) {
  const completedSessionKeyRef = useRef<string | null>(null)
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
    () => {
      const currentDateKey = getLocalDateKey(Date.now())

      return initialTodayFocusDateKey === currentDateKey ? initialTodayFocusDateKey : currentDateKey
    },
  )
  const [todayFocusSec, setTodayFocusSec] = useState(
    () => {
      const currentDateKey = getLocalDateKey(Date.now())

      return initialTodayFocusDateKey === currentDateKey ? initialTodayFocusSec : 0
    },
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

    const timerId = window.setTimeout(() => {
      setTodayFocusDateKey(nextDateKey)
      setTodayFocusSec(0)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
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

  const commitRunningTime = useCallback(
    (targetTodoId: number, shouldCreateSession = false) => {
      if (runningTodoId !== targetTodoId || startedAt === null) {
        return 0
      }

      const completionKey = shouldCreateSession
        ? `${targetTodoId}:${startedAt}:${timerDurationSec}`
        : null

      if (completionKey && completedSessionKeyRef.current === completionKey) {
        return 0
      }

      if (completionKey) {
        completedSessionKeyRef.current = completionKey
      }

      const commitTime = Date.now()
      const expectedCompletedAt = startedAt + timerRemainingSec * 1000
      const effectiveCompletedAt = shouldCreateSession
        ? Math.min(commitTime, expectedCompletedAt)
        : commitTime
      const targetTodo = todos.find((todo) => todo.id === targetTodoId)
      const elapsedSeconds = shouldCreateSession
        ? timerRemainingSec
        : Math.min(timerRemainingSec, getElapsedSinceStart(startedAt, commitTime))
      const nextDateKey = getLocalDateKey(effectiveCompletedAt)
      const todayElapsedSeconds = Math.min(
        elapsedSeconds,
        getTodayElapsedSeconds(startedAt, effectiveCompletedAt),
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
          completedAt: effectiveCompletedAt,
          durationSec: timerDurationSec,
          startedAt: activeSessionStartedAt,
          todo: targetTodo,
        })

        setSessions((currentSessions) => [completedSession, ...currentSessions])
        trackEvent('timer_completed', {
          durationMinutes: Math.round(timerDurationSec / 60),
          todoId: targetTodo.id,
        })
        onTimerCompleted?.({
          durationSec: timerDurationSec,
          todoId: targetTodo.id,
          todoTitle: targetTodo.title,
        })
      }

      setTimerRemainingSec(Math.max(0, timerRemainingSec - elapsedSeconds))
      setStartedAt(null)
      setActiveSessionStartedAt(shouldCreateSession ? null : activeSessionStartedAt)
      setNow(effectiveCompletedAt)

      return elapsedSeconds
    },
    [
      activeSessionStartedAt,
      onTimerCompleted,
      runningTodoId,
      setSessions,
      setTodos,
      startedAt,
      timerDurationSec,
      timerRemainingSec,
      todayFocusDateKey,
      todos,
    ],
  )

  useEffect(() => {
    if (runningTodoId === null || startedAt === null || displayedRemainingSec > 0) {
      return
    }

    const timerId = window.setTimeout(() => {
      commitRunningTime(runningTodoId, true)
      setRunningTodoId(null)
    }, 0)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [commitRunningTime, displayedRemainingSec, runningTodoId, startedAt])

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

    completedSessionKeyRef.current = null
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
    setRunningTodoId(null)
    setTimerRemainingSec(timerDurationSec)
    setStartedAt(null)
    setActiveSessionStartedAt(null)
    completedSessionKeyRef.current = null
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
