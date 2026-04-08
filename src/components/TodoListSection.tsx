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
        <p className="section-label">Todo List</p>
        <h2>Your Tasks</h2>
      </div>

      <form className="todo-create-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a new task"
          aria-label="Add a new task"
        />
        <button type="submit">Add Task</button>
      </form>

      <div className="todo-toolbar" aria-label="Todo filters">
        <div className="filter-group">
          <button
            type="button"
            className={filter === 'all' ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={filter === 'active' ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setFilter('active')}
          >
            In Progress
          </button>
          <button
            type="button"
            className={filter === 'completed' ? 'filter-chip active' : 'filter-chip'}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
        </div>
        <span className="filter-caption">
          {filteredTodos.length} item{filteredTodos.length === 1 ? '' : 's'}
        </span>
      </div>

      {filteredTodos.length === 0 ? (
        <div className="empty-state">
          <p className="section-label">No Tasks</p>
          <strong>
            {filter === 'completed'
              ? 'No completed tasks yet.'
              : filter === 'active'
                ? 'No tasks in progress right now.'
                : 'Add your first task to get started.'}
          </strong>
          <span>
            {filter === 'all'
              ? 'Use the form above to create a new todo.'
              : 'Try switching filters or update a task state.'}
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
