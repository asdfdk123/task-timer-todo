import type { TimerSession } from "../types/session";
import {
  getRecentSessions,
  getSessionsGroupedByDate,
  getSessionsInCurrentWeek,
  getTotalSessionDuration,
  getWeekdaySummary,
} from "../utils/sessionSelectors";
import { formatReadableDuration, getLocalDateKey } from "../utils/time";

type RecordsPageProps = {
  sessions: TimerSession[];
};

function formatSessionTime(timestamp: number) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatSessionDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function RecordsPage({ sessions }: RecordsPageProps) {
  // eslint-disable-next-line react-hooks/purity
  const todayKey = getLocalDateKey(Date.now());
  const todaySessions = sessions.filter((session) => session.date === todayKey);
  const weekSessions = getSessionsInCurrentWeek(sessions);
  const weekdaySummary = getWeekdaySummary(weekSessions);
  const recentSessions = getRecentSessions(sessions, 6);
  const dateGroups = getSessionsGroupedByDate(sessions).slice(0, 5);
  const maxWeekdaySec = Math.max(
    ...weekdaySummary.map((day) => day.totalSec),
    1,
  );

  return (
    <>
      <header className="hero-header">
        <h1>집중 기록</h1>
        <p>완료한 세션을 기준으로 오늘과 이번주의 집중 흐름을 확인하세요.</p>
      </header>

      <section className="record-summary-grid" aria-label="집중 요약">
        <article className="record-summary-card panel">
          <span className="section-label">오늘</span>
          <strong>
            {formatReadableDuration(getTotalSessionDuration(todaySessions))}
          </strong>
          <p>완료 세션 {todaySessions.length}개</p>
        </article>
        <article className="record-summary-card panel">
          <span className="section-label">이번주</span>
          <strong>
            {formatReadableDuration(getTotalSessionDuration(weekSessions))}
          </strong>
          <p>완료 세션 {weekSessions.length}개</p>
        </article>
      </section>

      <section className="panel records-card">
        <div className="section-heading">
          <p className="section-label">요일별 기록</p>
          <h2>이번주 집중 시간</h2>
        </div>

        <div className="weekday-grid" aria-label="요일별 집중 시간 요약">
          {weekdaySummary.map((day) => (
            <article key={day.weekday} className="weekday-card">
              <span>{day.weekday.slice(0, 1)}</span>
              <div className="weekday-bar-track">
                <div
                  className="weekday-bar-fill"
                  style={{
                    height: `${day.totalSec === 0 ? 0 : Math.max(8, (day.totalSec / maxWeekdaySec) * 100)}%`,
                  }}
                />
              </div>
              <strong>{formatReadableDuration(day.totalSec)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="panel records-card">
        <div className="section-heading">
          <p className="section-label">최근 세션</p>
          <h2>완료한 타이머</h2>
        </div>

        {recentSessions.length === 0 ? (
          <p className="history-empty">
            타이머를 끝까지 완료하면 첫 기록이 여기에 표시됩니다.
          </p>
        ) : (
          <ul className="session-list">
            {recentSessions.map((session) => (
              <li key={session.id} className="session-item">
                <div>
                  <strong>{session.todoTitle}</strong>
                  <span>
                    {formatSessionDate(session.date)} ·{" "}
                    {formatSessionTime(session.startedAt)}-
                    {formatSessionTime(session.completedAt)}
                  </span>
                </div>
                <strong>{formatReadableDuration(session.durationSec)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel records-card">
        <div className="section-heading">
          <p className="section-label">날짜별 보기</p>
          <h2>캘린더용 기록 그룹</h2>
        </div>

        {dateGroups.length === 0 ? (
          <p className="history-empty">
            완료한 세션이 생기면 날짜별 기록이 표시됩니다.
          </p>
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
      </section>
    </>
  );
}
