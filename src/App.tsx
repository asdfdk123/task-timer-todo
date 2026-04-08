import { useEffect, useState } from 'react'
import { ActiveTaskCard } from './components/ActiveTaskCard'
import { SummarySection } from './components/SummarySection'
import { TodoListSection } from './components/TodoListSection'
import { useTodoAppStorage } from './hooks/useTodoAppStorage'
import type { Todo } from './types/todo'
import type { TodoAppState } from './types/todoAppState'
import { loadTodoAppState, sanitizeTodoAppState } from './utils/storage'
import { formatDuration } from './utils/time'
import './App.css'

const initialTodos: Todo[] = [
  { id: 1, title: 'Write project outline', completed: false, totalElapsedSec: 2720 },
  { id: 2, title: 'Design main screen layout', completed: true, totalElapsedSec: 4330 },
  { id: 3, title: 'Prepare timer interaction flow', completed: false, totalElapsedSec: 1115 },
]

const fallbackState: TodoAppState = {
  runningTodoId: null,
  selectedTodoId: initialTodos.find((todo) => !todo.completed)?.id ?? initialTodos[0]?.id ?? null,
  startedAt: null,
  todos: initialTodos,
}

function App() {
  const [initialState] = useState(() => loadTodoAppState(fallbackState))
  const [todos, setTodos] = useState(initialState.todos)
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(initialState.selectedTodoId)
  const [runningTodoId, setRunningTodoId] = useState<number | null>(initialState.runningTodoId)
  const [startedAt, setStartedAt] = useState<number | null>(initialState.startedAt)
  const [now, setNow] = useState(() => Date.now())

  useTodoAppStorage(
    sanitizeTodoAppState({
      runningTodoId,
      selectedTodoId,
      startedAt,
      todos,
    }),
  )

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

  useEffect(() => {
    if (selectedTodoId !== null && todos.some((todo) => todo.id === selectedTodoId)) {
      return
    }

    const fallbackTodo = todos.find((todo) => !todo.completed) ?? todos[0] ?? null
    setSelectedTodoId(fallbackTodo?.id ?? null)
  }, [selectedTodoId, todos])

  const completedCount = todos.filter((todo) => todo.completed).length
  const selectedTodo = todos.find((todo) => todo.id === selectedTodoId) ?? null

  const getRunningSeconds = (todo: Todo) => {
    if (todo.id !== runningTodoId || startedAt === null) {
      return todo.totalElapsedSec
    }

    const additionalSeconds = Math.floor((now - startedAt) / 1000)
    return todo.totalElapsedSec + Math.max(0, additionalSeconds)
  }

  const displayedElapsedById = Object.fromEntries(
    todos.map((todo) => [todo.id, getRunningSeconds(todo)]),
  ) as Record<number, number>

  const commitRunningTime = (targetTodoId: number) => {
    if (runningTodoId !== targetTodoId || startedAt === null) {
      return
    }

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000))

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

  const handleAddTodo = (title: string) => {
    const nextTodo: Todo = {
      id: Date.now(),
      title,
      completed: false,
      totalElapsedSec: 0,
    }

    setTodos((currentTodos) => [nextTodo, ...currentTodos])
    setSelectedTodoId(nextTodo.id)
  }

  const handleUpdateTodo = (id: number, title: string) => {
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              title,
            }
          : todo,
      ),
    )
  }

  const handleDeleteTodo = (id: number) => {
    if (runningTodoId === id) {
      setRunningTodoId(null)
      setStartedAt(null)
    }

    if (selectedTodoId === id) {
      setSelectedTodoId(null)
    }

    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id))
  }

  const handleToggleTodo = (id: number) => {
    if (runningTodoId === id) {
      commitRunningTime(id)
      setRunningTodoId(null)
    }

    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id
          ? {
              ...todo,
              completed: !todo.completed,
            }
          : todo,
      ),
    )
  }

  const handleSelectTodo = (id: number) => {
    setSelectedTodoId(id)
  }

  const handleStartTimer = () => {
    if (selectedTodo === null) {
      return
    }

    if (runningTodoId !== null && runningTodoId !== selectedTodo.id) {
      commitRunningTime(runningTodoId)
    }

    if (runningTodoId === selectedTodo.id) {
      return
    }

    setRunningTodoId(selectedTodo.id)
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
    if (runningTodoId !== null) {
      commitRunningTime(runningTodoId)
      setRunningTodoId(null)
    }
  }

  const selectedElapsed = selectedTodo
    ? displayedElapsedById[selectedTodo.id] ?? selectedTodo.totalElapsedSec
    : 0

  return (
    <main className="app">
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">TODO Timer App</p>
          <h1>Focus on one task while keeping the whole list in view.</h1>
        </header>

        <SummarySection
          totalCount={todos.length}
          completedCount={completedCount}
          focusLabel={selectedTodo?.title ?? 'No active task'}
        />

        <ActiveTaskCard
          elapsedTime={formatDuration(selectedElapsed)}
          isRunning={runningTodoId === selectedTodo?.id}
          onPause={handlePauseTimer}
          onStart={handleStartTimer}
          onStop={handleStopTimer}
          title={selectedTodo?.title ?? 'No active task selected'}
        />

        <TodoListSection
          displayedElapsedById={displayedElapsedById}
          runningTodoId={runningTodoId}
          selectedTodoId={selectedTodoId}
          todos={todos}
          onAddTodo={handleAddTodo}
          onDeleteTodo={handleDeleteTodo}
          onSelectTodo={handleSelectTodo}
          onToggleTodo={handleToggleTodo}
          onUpdateTodo={handleUpdateTodo}
        />
      </div>
    </main>
  )
}

export default App
