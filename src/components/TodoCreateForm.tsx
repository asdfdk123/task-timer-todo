import { useRef, useState, type FormEvent } from 'react'

type TodoCreateFormProps = {
  onAddTodo: (title: string) => void | number
}

export function TodoCreateForm({ onAddTodo }: TodoCreateFormProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('')
  const trimmedTitle = title.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!trimmedTitle) {
      inputRef.current?.focus()
      return
    }

    onAddTodo(trimmedTitle)
    setTitle('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <form className="todo-create-card" onSubmit={handleSubmit} aria-label="새 할 일 추가">
      <div className="todo-create-copy">
        <span className="section-label">빠른 추가</span>
        <strong>집중할 일을 적어두세요</strong>
        <p>엔터를 누르거나 추가 버튼을 눌러 바로 목록에 넣을 수 있어요.</p>
      </div>

      <div className="todo-create-row">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="예: 25분 동안 문서 초안 정리"
          aria-label="새 할 일 제목"
        />
        <button type="submit" disabled={!trimmedTitle} aria-label="할 일 추가">
          추가
        </button>
      </div>
    </form>
  )
}
