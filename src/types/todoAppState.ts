import type { TimerSession } from './session'
import type { Todo } from './todo'

export type TodoAppState = {
  todos: Todo[]
  sessions: TimerSession[]
  selectedTodoId: number | null
  runningTodoId: number | null
  startedAt: number | null
  activeSessionStartedAt: number | null
  timerDurationSec: number
  timerRemainingSec: number
  todayFocusDateKey: string
  todayFocusSec: number
}
