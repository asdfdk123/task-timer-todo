import { useState } from 'react'
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
            className={`status-badge ${todo.completed ? 'done' : 'pending'}`}
            aria-label={todo.completed ? '완료됨' : '진행 중'}
          >
            {todo.completed ? '완료' : '진행중'}
          </span>
        </label>

        {isEditing ? (
          <div className="todo-edit-form">
            <input
              type="text"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              aria-label="할 일 제목 수정"
            />
            <div className="todo-actions">
              <button type="button" onClick={handleSave}>
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
            {isRunning ? <span className="live-indicator">진행 중</span> : null}
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
