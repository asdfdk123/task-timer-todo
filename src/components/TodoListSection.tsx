import { useState, type FormEvent } from 'react'
import { TodoItem } from './TodoItem'
import type { Todo } from '../types/todo'

type TodoListSectionProps = {
  displayedElapsedById: Record<number, number>
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
  selectedTodoId,
  todos,
  onAddTodo,
  onDeleteTodo,
  onSelectTodo,
  onToggleTodo,
  onUpdateTodo,
}: TodoListSectionProps) {
  const [newTitle, setNewTitle] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedTitle = newTitle.trim()

    if (!trimmedTitle) {
      return
    }

    onAddTodo(trimmedTitle)
    setNewTitle('')
  }

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

      <ul className="todo-list">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            displayedElapsedSec={displayedElapsedById[todo.id] ?? todo.totalElapsedSec}
            isSelected={selectedTodoId === todo.id}
            todo={todo}
            onDelete={onDeleteTodo}
            onSelect={onSelectTodo}
            onToggle={onToggleTodo}
            onUpdate={onUpdateTodo}
          />
        ))}
      </ul>
    </section>
  )
}
