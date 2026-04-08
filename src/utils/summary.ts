import type { Todo } from '../types/todo'
import { formatReadableDuration } from './time'

type SummaryInput = {
  activeTaskTitle: string | null
  completedCount: number
  isRunning: boolean
  todayFocusSec: number
  totalCount: number
}

export function buildSummaryCards({
  activeTaskTitle,
  completedCount,
  isRunning,
  todayFocusSec,
  totalCount,
}: SummaryInput) {
  return [
    {
      label: 'Today',
      value: formatReadableDuration(todayFocusSec),
      description: 'Total Focus Time',
    },
    {
      label: 'Completed',
      value: String(completedCount),
      description: 'Tasks Done',
    },
    {
      label: 'Total',
      value: String(totalCount),
      description: 'All Tasks',
    },
    {
      label: 'Status',
      value: isRunning ? 'In Progress' : 'Idle',
      description: activeTaskTitle ?? 'No active task',
      emphasizeText: true,
    },
  ]
}

export function getCompletedCount(todos: Todo[]) {
  return todos.filter((todo) => todo.completed).length
}
