import type { TimerSession } from '../types/session'
import {
  getRecentSessions,
  getSessionsGroupedByDate,
  getTotalSessionDuration,
  getWeekdaySummary,
} from '../utils/sessionSelectors'
import { formatReadableDuration } from '../utils/time'

type SessionHistorySectionProps = {
  sessions: TimerSession[]
  todaySessions: TimerSession[]
}

function formatSessionTime(timestamp: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function SessionHistorySection({
  sessions,
  todaySessions,
}: SessionHistorySectionProps) {
  const todayTotalSec = getTotalSessionDuration(todaySessions)
  const weekdaySummary = getWeekdaySummary(sessions)
  const recentSessions = getRecentSessions(sessions)
  const dateGroups = getSessionsGroupedByDate(sessions).slice(0, 4)
  const maxWeekdaySec = Math.max(...weekdaySummary.map((day) => day.totalSec), 1)

  return (
    <section className="panel history-section">
      <div className="section-heading">
        <p className="section-label">기록</p>
        <h2>집중 기록</h2>
      </div>

      <div className="history-today-card">
        <span className="section-label">오늘 총 기록</span>
        <strong>{formatReadableDuration(todayTotalSec)}</strong>
        <span>오늘 완료한 세션 {todaySessions.length}개</span>
      </div>

      <div className="weekday-grid" aria-label="요일별 집중 시간 요약">
        {weekdaySummary.map((day) => (
          <article key={day.weekday} className="weekday-card">
            <span>{day.weekday.slice(0, 1)}</span>
            <div className="weekday-bar-track">
              <div
                className="weekday-bar-fill"
                style={{ height: `${Math.max(6, (day.totalSec / maxWeekdaySec) * 100)}%` }}
              />
            </div>
            <strong>{formatReadableDuration(day.totalSec)}</strong>
          </article>
        ))}
      </div>

      <div className="history-columns">
        <div className="history-panel">
          <h3>최근 세션</h3>
          {recentSessions.length === 0 ? (
            <p className="history-empty">타이머를 끝까지 완료하면 첫 세션 기록이 만들어집니다.</p>
          ) : (
            <ul className="session-list">
              {recentSessions.map((session) => (
                <li key={session.id} className="session-item">
                  <div>
                    <strong>{session.todoTitle}</strong>
                    <span>
                      {formatSessionDate(session.date)} · {formatSessionTime(session.startedAt)}-
                      {formatSessionTime(session.completedAt)}
                    </span>
                  </div>
                  <strong>{formatReadableDuration(session.durationSec)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="history-panel">
          <h3>날짜별 기록</h3>
          {dateGroups.length === 0 ? (
            <p className="history-empty">완료한 세션이 생기면 날짜별 기록이 표시됩니다.</p>
          ) : (
            <ul className="date-group-list">
              {dateGroups.map((group) => (
                <li key={group.date} className="date-group-item">
                  <div>
                    <strong>{formatSessionDate(group.date)}</strong>
                    <span>세션 {group.sessions.length}개</span>
                  </div>
                  <strong>{formatReadableDuration(group.totalSec)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
