import { useEffect, useState } from 'react'
import { ActiveTaskCard } from './components/ActiveTaskCard'
import { SummarySection } from './components/SummarySection'
import { TodoListSection } from './components/TodoListSection'
import { useTodoTimer } from './hooks/useTodoTimer'
import type { Todo } from './types/todo'
import { formatDuration } from './utils/time'
import './App.css'

const initialTodos: Todo[] = [
  { id: 1, title: 'Write project outline', completed: false, totalElapsedSec: 2720 },
  { id: 2, title: 'Design main screen layout', completed: true, totalElapsedSec: 4330 },
  { id: 3, title: 'Prepare timer interaction flow', completed: false, totalElapsedSec: 1115 },
]

function App() {
  const [todos, setTodos] = useState(initialTodos)
  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(
    initialTodos.find((todo) => !todo.completed)?.id ?? initialTodos[0]?.id ?? null,
  )

  useEffect(() => {
    if (selectedTodoId !== null && todos.some((todo) => todo.id === selectedTodoId)) {
      return
    }

    const fallbackTodo = todos.find((todo) => !todo.completed) ?? todos[0] ?? null
    setSelectedTodoId(fallbackTodo?.id ?? null)
  }, [selectedTodoId, todos])

  const {
    displayedElapsedById,
    handleCompleteTimerTarget,
    handlePauseTimer,
    handleRemoveTimerTarget,
    handleStartTimer,
    handleStopTimer,
    runningTodoId,
  } = useTodoTimer({
    selectedTodoId,
    setSelectedTodoId,
    setTodos,
    todos,
  })

  const completedCount = todos.filter((todo) => todo.completed).length
  const selectedTodo = todos.find((todo) => todo.id === selectedTodoId) ?? null
  const runningTodo = todos.find((todo) => todo.id === runningTodoId) ?? null
  const activeCardTodo = runningTodo ?? selectedTodo

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
    handleRemoveTimerTarget(id)

    if (selectedTodoId === id) {
      setSelectedTodoId(null)
    }

    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id))
  }

  const handleToggleTodo = (id: number) => {
    handleCompleteTimerTarget(id)

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

  const activeElapsed = activeCardTodo
    ? displayedElapsedById[activeCardTodo.id] ?? activeCardTodo.totalElapsedSec
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
          focusLabel={activeCardTodo?.title ?? 'No active task'}
        />

        <ActiveTaskCard
          elapsedTime={formatDuration(activeElapsed)}
          isRunning={runningTodoId === activeCardTodo?.id}
          onPause={handlePauseTimer}
          onStart={handleStartTimer}
          onStop={handleStopTimer}
          title={activeCardTodo?.title ?? 'No active task selected'}
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
