import type { Todo } from './todo'

export type TodoAppState = {
  runningTodoId: number | null
  selectedTodoId: number | null
  startedAt: number | null
  todos: Todo[]
}
