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
      label: '오늘',
      value: formatReadableDuration(todayFocusSec),
      description: '총 집중 시간',
    },
    {
      label: '완료',
      value: String(completedCount),
      description: '완료한 할 일',
    },
    {
      label: '전체',
      value: String(totalCount),
      description: '전체 할 일',
    },
    {
      label: '상태',
      value: isRunning ? '진행 중' : '대기 중',
      description: activeTaskTitle ?? '현재 작업 없음',
      emphasizeText: true,
    },
  ]
}

export function getCompletedCount(todos: Todo[]) {
  return todos.filter((todo) => todo.completed).length
}
