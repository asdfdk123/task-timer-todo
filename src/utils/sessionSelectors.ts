import type { TimerSession } from '../types/session'

const WEEKDAYS = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
const LEGACY_WEEKDAY_LABELS: Record<string, string> = {
  Monday: '월요일',
  Tuesday: '화요일',
  Wednesday: '수요일',
  Thursday: '목요일',
  Friday: '금요일',
  Saturday: '토요일',
  Sunday: '일요일',
}

function normalizeWeekday(weekday: string) {
  return LEGACY_WEEKDAY_LABELS[weekday] ?? weekday
}

export function getSessionsByDate(sessions: TimerSession[], date: string) {
  return sessions.filter((session) => session.date === date)
}

export function getSessionsByWeekday(sessions: TimerSession[], weekday: string) {
  return sessions.filter((session) => normalizeWeekday(session.weekday) === weekday)
}

export function getTotalSessionDuration(sessions: TimerSession[]) {
  return sessions.reduce((total, session) => total + session.durationSec, 0)
}

export function getSessionsInCurrentWeek(sessions: TimerSession[], baseDate = new Date()) {
  const weekStart = new Date(baseDate)
  const day = weekStart.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  weekStart.setDate(weekStart.getDate() + diffToMonday)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  return sessions.filter((session) => {
    const completedAt = new Date(session.completedAt)

    return completedAt >= weekStart && completedAt < weekEnd
  })
}

export function getWeekdaySummary(sessions: TimerSession[]) {
  return WEEKDAYS.map((weekday) => ({
    weekday,
    totalSec: getTotalSessionDuration(getSessionsByWeekday(sessions, weekday)),
  }))
}

export function getRecentSessions(sessions: TimerSession[], limit = 5) {
  return [...sessions]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, limit)
}

export function getSessionsGroupedByDate(sessions: TimerSession[]) {
  const groups = new Map<string, TimerSession[]>()

  for (const session of getRecentSessions(sessions, sessions.length)) {
    groups.set(session.date, [...(groups.get(session.date) ?? []), session])
  }

  return Array.from(groups, ([date, dateSessions]) => ({
    date,
    sessions: dateSessions,
    totalSec: getTotalSessionDuration(dateSessions),
  }))
}
