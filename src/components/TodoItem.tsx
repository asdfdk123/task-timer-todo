import { useState } from 'react'
import type { Todo } from '../types/todo'
import { formatDuration } from '../utils/time'

type TodoItemProps = {
  todo: Todo
  displayedElapsedSec: number
  onDelete: (id: number) => void
  onSelect: (id: number) => void
  onToggle: (id: number) => void
  onUpdate: (id: number, title: string) => void
  isSelected: boolean
}

export function TodoItem({
  todo,
  displayedElapsedSec,
  onDelete,
  onSelect,
  onToggle,
  onUpdate,
  isSelected,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(todo.title)

  const handleSave = () => {
    const trimmedTitle = draftTitle.trim()

    if (!trimmedTitle) {
      return
    }

    onUpdate(todo.id, trimmedTitle)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraftTitle(todo.title)
    setIsEditing(false)
  }

  return (
    <li className={`todo-item ${isSelected ? 'selected' : ''}`}>
      <div className="todo-main">
        <label className="todo-toggle">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
          />
          <span
            className={`status-badge ${todo.completed ? 'done' : 'pending'}`}
            aria-label={todo.completed ? 'Completed' : 'Pending'}
          >
            {todo.completed ? 'Done' : 'Open'}
          </span>
        </label>

        {isEditing ? (
          <div className="todo-edit-form">
            <input
              type="text"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              aria-label="Edit todo title"
            />
            <div className="todo-actions">
              <button type="button" onClick={handleSave}>
                Save
              </button>
              <button type="button" className="ghost-button" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="todo-select-button" onClick={() => onSelect(todo.id)}>
            <span className={todo.completed ? 'todo-title completed' : 'todo-title'}>
              {todo.title}
            </span>
          </button>
        )}
      </div>

      <div className="todo-side">
        <div className="todo-meta">
          <span className="time-label">Accumulated Time</span>
          <strong>{formatDuration(displayedElapsedSec)}</strong>
        </div>

        {!isEditing ? (
          <div className="todo-actions">
            <button type="button" className="ghost-button" onClick={() => onSelect(todo.id)}>
              Select
            </button>
            <button type="button" className="ghost-button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
            <button type="button" className="danger-button" onClick={() => onDelete(todo.id)}>
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </li>
  )
}
