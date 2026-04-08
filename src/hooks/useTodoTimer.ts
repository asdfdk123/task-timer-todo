import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { Todo } from '../types/todo'

type UseTodoTimerParams = {
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
  selectedTodoId,
  setSelectedTodoId,
  setTodos,
  todos,
}: UseTodoTimerParams) {
  const [runningTodoId, setRunningTodoId] = useState<number | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

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

    const elapsedSeconds = calculateElapsedSeconds(0, startedAt, Date.now())

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

    setStartedAt(null)
    setNow(Date.now())
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
    handleCompleteTimerTarget,
    handlePauseTimer,
    handleRemoveTimerTarget,
    handleStartTimer,
    handleStopTimer,
    runningTodoId,
  }
}
