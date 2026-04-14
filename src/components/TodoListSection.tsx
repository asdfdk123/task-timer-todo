import { useState, type FormEvent } from 'react'
import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo'

type TodoFilter = 'all' | 'active' | 'completed'

type TodoListSectionProps = {
  displayedElapsedById: Record<number, number>
  runningTodoId: number | null
  selectedTodoId: number | null
  todos: Todo[]
  onAddTodo: (title: string) => void
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
  const [newTitle, setNewTitle] = useState('')
  const [filter, setFilter] = useState<TodoFilter>('all')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = newTitle.trim()

    if (!trimmedTitle) {
      return
    }

    onAddTodo(trimmedTitle)
    setNewTitle('')
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

      <form className="todo-create-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="새 할 일을 입력하세요"
          aria-label="새 할 일 입력"
        />
        <button type="submit">할 일 추가</button>
      </form>

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
              ? '아직 완료한 할 일이 없습니다.'
              : filter === 'active'
                ? '현재 진행 중인 할 일이 없습니다.'
                : '첫 번째 할 일을 추가해 보세요.'}
          </strong>
          <span>
            {filter === 'all'
              ? '위 입력창에서 새 할 일을 만들 수 있습니다.'
              : '다른 필터를 선택하거나 할 일 상태를 변경해 보세요.'}
          </span>
        </div>
      ) : (
        <ul className="todo-list">
          {filteredTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              displayedElapsedSec={displayedElapsedById[todo.id] ?? todo.totalElapsedSec}
              isRunning={runningTodoId === todo.id}
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
