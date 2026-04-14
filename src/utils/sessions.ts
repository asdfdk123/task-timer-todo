import type { TimerSession } from '../types/session'
import type { Todo } from '../types/todo'
import { getLocalDateKey } from './time'

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('ko-KR', {
  weekday: 'long',
})

type CreateTimerSessionParams = {
  completedAt: number
  durationSec: number
  startedAt: number
  todo: Todo
}

export function getWeekday(timestamp: number) {
  return WEEKDAY_FORMATTER.format(new Date(timestamp))
}

export function createTimerSession({
  completedAt,
  durationSec,
  startedAt,
  todo,
}: CreateTimerSessionParams): TimerSession {
  return {
    id: `${completedAt}-${todo.id}`,
    date: getLocalDateKey(completedAt),
    weekday: getWeekday(completedAt),
    durationSec,
    startedAt,
    completedAt,
    todoId: todo.id,
    todoTitle: todo.title,
  }
}
