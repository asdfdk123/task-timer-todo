import { InteractiveTimer } from '../components/InteractiveTimer'
import { TodoListSection } from '../components/TodoListSection'
import type { Todo } from '../types/todo'
import { formatDuration, formatReadableDuration } from '../utils/time'

const QUICK_MINUTES = [5, 15, 25, 50]

type TimerState = 'idle' | 'running' | 'paused' | 'finished'

type TimerPageProps = {
  displayedElapsedById: Record<number, number>
  displayedRemainingSec: number
  runningTodoId: number | null
  selectedTodo: Todo | null
  selectedTodoId: number | null
  sessionsTodayCount: number
  timerDurationSec: number
  todayFocusSec: number
  todos: Todo[]
  onAddTodo: (title: string) => void
  onDeleteTodo: (id: number) => void
  onDurationChange: (durationSeconds: number) => void
  onPause: () => void
  onReset: () => void
  onSelectTodo: (id: number) => void
  onStart: () => void
  onToggleTodo: (id: number) => void
  onUpdateTodo: (id: number, title: string) => void
}

function getTimerState({
  displayedRemainingSec,
  isRunning,
  timerDurationSec,
}: {
  displayedRemainingSec: number
  isRunning: boolean
  timerDurationSec: number
}): TimerState {
  if (isRunning) {
    return 'running'
  }

  if (displayedRemainingSec === 0) {
    return 'finished'
  }

  if (displayedRemainingSec < timerDurationSec) {
    return 'paused'
  }

  return 'idle'
}

function getStateText(timerState: TimerState) {
  if (timerState === 'running') {
    return {
      helperText: '집중이 진행 중입니다',
      label: '집중 중',
    }
  }

  if (timerState === 'paused') {
    return {
      helperText: '이어 하거나 초기화할 수 있어요',
      label: '일시정지',
    }
  }

  if (timerState === 'finished') {
    return {
      helperText: '세션이 기록되었습니다',
      label: '완료',
    }
  }

  return {
    helperText: '원을 드래그해 시간을 정하세요',
    label: '시간 설정',
  }
}

export function TimerPage({
  displayedElapsedById,
  displayedRemainingSec,
  runningTodoId,
  selectedTodo,
  selectedTodoId,
  sessionsTodayCount,
  timerDurationSec,
  todayFocusSec,
  todos,
  onAddTodo,
  onDeleteTodo,
  onDurationChange,
  onPause,
  onReset,
  onSelectTodo,
  onStart,
  onToggleTodo,
  onUpdateTodo,
}: TimerPageProps) {
  const isRunning = runningTodoId !== null
  const timerState = getTimerState({
    displayedRemainingSec,
    isRunning,
    timerDurationSec,
  })
  const stateText = getStateText(timerState)
  const canEditTimer = timerState === 'idle'
  const activeTaskLabel = selectedTodo?.title ?? '할 일을 선택해 주세요'

  return (
    <>
      <header className="hero-header">
        <h1>집중 타이머</h1>
        <p>할 일을 하나 고르고, 정한 시간만큼 차분히 몰입해 보세요.</p>
      </header>

      <section className="timer-card panel" aria-label="타이머 설정과 실행">
        <div className="timer-task">
          <span>현재 작업</span>
          <strong>{activeTaskLabel}</strong>
        </div>

        <InteractiveTimer
          durationSeconds={timerDurationSec}
          helperText={stateText.helperText}
          isInteractive={canEditTimer}
          isRunning={isRunning}
          onDurationChange={onDurationChange}
          remainingSeconds={displayedRemainingSec}
          remainingTime={formatDuration(displayedRemainingSec)}
          state={timerState}
          stateLabel={stateText.label}
        />

        {canEditTimer ? (
          <div className="quick-chip-row" aria-label="빠른 시간 설정">
            {QUICK_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={
                  timerDurationSec === minutes * 60 ? 'quick-chip active' : 'quick-chip'
                }
                onClick={() => onDurationChange(minutes * 60)}
              >
                {minutes}분
              </button>
            ))}
          </div>
        ) : null}

        <div className="timer-controls" aria-label="타이머 제어">
          {timerState === 'idle' ? (
            <button type="button" className="primary-button" onClick={onStart}>
              시작
            </button>
          ) : null}
          {timerState === 'running' ? (
            <>
              <button type="button" className="primary-button" onClick={onPause}>
                일시정지
              </button>
              <button type="button" className="secondary-button" onClick={onReset}>
                초기화
              </button>
            </>
          ) : null}
          {timerState === 'paused' ? (
            <>
              <button type="button" className="primary-button" onClick={onStart}>
                계속
              </button>
              <button type="button" className="secondary-button" onClick={onReset}>
                초기화
              </button>
            </>
          ) : null}
          {timerState === 'finished' ? (
            <button type="button" className="primary-button" onClick={onReset}>
              새 타이머
            </button>
          ) : null}
        </div>
      </section>

      <section className="today-record-card panel" aria-label="오늘의 기록">
        <div>
          <span className="section-label">오늘의 기록</span>
          <strong>{formatReadableDuration(todayFocusSec)}</strong>
        </div>
        <p>완료한 세션 {sessionsTodayCount}개</p>
      </section>

      <TodoListSection
        displayedElapsedById={displayedElapsedById}
        runningTodoId={runningTodoId}
        selectedTodoId={selectedTodoId}
        todos={todos}
        onAddTodo={onAddTodo}
        onDeleteTodo={onDeleteTodo}
        onSelectTodo={onSelectTodo}
        onToggleTodo={onToggleTodo}
        onUpdateTodo={onUpdateTodo}
      />
    </>
  )
}
