import type { Todo } from './todo'

export type TodoAppState = {
  todos: Todo[]
  selectedTodoId: number | null
  runningTodoId: number | null
  startedAt: number | null
  todayFocusDateKey: string
  todayFocusSec: number
}
