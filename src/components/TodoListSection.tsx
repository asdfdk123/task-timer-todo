import { useEffect, useState } from 'react'
import { TodoCreateForm } from './TodoCreateForm'
import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo'

type TodoFilter = 'all' | 'active' | 'completed'

type TodoListSectionProps = {
  displayedElapsedById: Record<number, number>
  runningTodoId: number | null
  selectedTodoId: number | null
  todos: Todo[]
  onAddTodo: (title: string) => number
  onDeleteTodo: (id: number) => void
  onSelectTodo: (id: number) => void
  onToggleTodo: (id: number) => void
  onUpdateTodo: (id: number, title: string) => void
}

export function TodoListSection({
  displayedElapsedById,
  runningTodoId,
  selectedTodoId,
  todos,
  onAddTodo,
  onDeleteTodo,
  onSelectTodo,
  onToggleTodo,
  onUpdateTodo,
}: TodoListSectionProps) {
  const [filter, setFilter] = useState<TodoFilter>('all')
  const [recentlyAddedTodoId, setRecentlyAddedTodoId] = useState<number | null>(null)

  useEffect(() => {
    if (recentlyAddedTodoId === null) {
      return
    }

    const timerId = window.setTimeout(() => {
      setRecentlyAddedTodoId(null)
    }, 900)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [recentlyAddedTodoId])

  const handleAddTodo = (title: string) => {
    const newTodoId = onAddTodo(title)

    setFilter('all')
    setRecentlyAddedTodoId(newTodoId)
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') {
      return !todo.completed
    }

    if (filter === 'completed') {
      return todo.completed
    }

    return true
  })

  return (
    <section className="panel todo-section">
      <div className="section-heading">
        <p className="section-label">할 일 목록</p>
        <h2>오늘의 할 일</h2>
      </div>

      <TodoCreateForm onAddTodo={handleAddTodo} />

      <div className="todo-toolbar" aria-label="할 일 필터">
        <div className="filter-group">
          <button
            type="button"
            className={filter === 'all' ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button
            type="button"
            className={filter === 'active' ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setFilter('active')}
          >
            진행중
          </button>
          <button
            type="button"
            className={filter === 'completed' ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setFilter('completed')}
          >
            완료
          </button>
        </div>
        <span className="filter-caption">
          {filteredTodos.length}개 표시 중
        </span>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          <p className="section-label">표시할 할 일이 없습니다</p>
          <strong>
            {filter === 'completed'
              ? '완료한 할 일이 생기면 여기에 모아둘게요.'
              : filter === 'active'
                ? '지금 바로 집중할 할 일이 없습니다.'
                : '오늘 집중할 첫 할 일을 적어보세요.'}
          </strong>
          <span>
            {filter === 'all'
              ? '위의 빠른 추가 영역에서 바로 등록할 수 있어요.'
              : '필터를 바꾸거나 할 일의 완료 상태를 조정해 보세요.'}
          </span>
        </div>
      ) : (
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              displayedElapsedSec={displayedElapsedById[todo.id] ?? todo.totalElapsedSec}
              isRunning={runningTodoId === todo.id}
              isNew={recentlyAddedTodoId === todo.id}
              isSelected={selectedTodoId === todo.id}
              todo={todo}
              onDelete={onDeleteTodo}
              onSelect={onSelectTodo}
              onToggle={onToggleTodo}
              onUpdate={onUpdateTodo}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
