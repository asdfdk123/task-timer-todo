import { useRef, useState } from 'react'
import type { Todo } from '../types/todo'
import { formatDuration } from '../utils/time'

type TodoItemProps = {
  todo: Todo
  displayedElapsedSec: number
  isRunning: boolean
  isNew: boolean
  onDelete: (id: number) => void
  onSelect: (id: number) => void
  onToggle: (id: number) => void
  onUpdate: (id: number, title: string) => void
  isSelected: boolean
}

export function TodoItem({
  todo,
  displayedElapsedSec,
  isRunning,
  isNew,
  onDelete,
  onSelect,
  onToggle,
  onUpdate,
  isSelected,
}: TodoItemProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(todo.title)
  const trimmedDraftTitle = draftTitle.trim()
  const isDraftValid = trimmedDraftTitle.length > 0

  const handleSave = () => {
    if (!isDraftValid) {
      textareaRef.current?.focus()
      return
    }

    onUpdate(todo.id, trimmedDraftTitle)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraftTitle(todo.title)
    setIsEditing(false)
  }

  const statusLabel = isRunning ? '진행중' : todo.completed ? '완료' : '대기'
  const statusClassName = isRunning ? 'running' : todo.completed ? 'done' : 'pending'

  return (
    <li
      className={`todo-item ${isSelected ? 'selected' : ''} ${todo.completed ? 'is-completed' : ''} ${isRunning ? 'is-running' : ''} ${isNew ? 'is-new' : ''}`}
    >
      <div className="todo-main">
        <label className="todo-toggle">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id)}
          />
          <span
            className={`status-badge ${statusClassName}`}
            aria-label={`할 일 상태: ${statusLabel}`}
          >
            {statusLabel}
          </span>
        </label>

        {isEditing ? (
          <div className="todo-edit-form">
            <textarea
              ref={textareaRef}
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              aria-label="할 일 제목 수정"
              aria-describedby={!isDraftValid ? `todo-edit-help-${todo.id}` : undefined}
              aria-invalid={!isDraftValid}
              autoFocus
              rows={3}
            />
            {!isDraftValid ? (
              <p id={`todo-edit-help-${todo.id}`} className="form-error">
                제목을 입력해야 저장할 수 있어요.
              </p>
            ) : null}
            <div className="todo-actions">
              <button type="button" onClick={handleSave} disabled={!isDraftValid}>
                저장
              </button>
              <button type="button" className="ghost-button" onClick={handleCancel}>
                취소
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
          <span className="time-label">누적 시간</span>
          <strong>{formatDuration(displayedElapsedSec)}</strong>
        </div>

        {!isEditing ? (
          <div className="todo-actions">
            <button type="button" className="ghost-button" onClick={() => onSelect(todo.id)}>
              선택
            </button>
            <button type="button" className="ghost-button" onClick={() => setIsEditing(true)}>
              수정
            </button>
            <button type="button" className="danger-button" onClick={() => onDelete(todo.id)}>
              삭제
            </button>
          </div>
        ) : null}
      </div>
    </li>
  )
}
