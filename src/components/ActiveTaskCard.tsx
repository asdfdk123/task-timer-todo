import { InteractiveTimer } from './InteractiveTimer'

type ActiveTaskCardProps = {
  title: string
  durationSeconds: number
  isRunning: boolean
  onDurationChange: (durationSeconds: number) => void
  onPause: () => void
  onReset: () => void
  onStart: () => void
  remainingSeconds: number
  remainingTime: string
}

export function ActiveTaskCard({
  title,
  durationSeconds,
  isRunning,
  onDurationChange,
  onPause,
  onReset,
  onStart,
  remainingSeconds,
  remainingTime,
}: ActiveTaskCardProps) {
  return (
    <section className="panel active-task-section">
      <div className="section-heading">
        <p className="section-label">현재 작업</p>
        <h2>{title}</h2>
      </div>

      <div className="active-task-body">
        <InteractiveTimer
          durationSeconds={durationSeconds}
          helperText={
            isRunning
              ? '집중이 진행 중입니다'
              : '원을 드래그해 시간을 정하세요'
          }
          isInteractive={!isRunning}
          isRunning={isRunning}
          onDurationChange={onDurationChange}
          remainingSeconds={remainingSeconds}
          remainingTime={remainingTime}
          state={isRunning ? 'running' : 'idle'}
          stateLabel={isRunning ? '집중 중' : '시간 설정'}
        />

        <div className="active-task-timer">
          <span className="timer-caption">남은 시간</span>
          <strong>{remainingTime}</strong>
          <span className="timer-helper">멈춘 상태에서 원형 타이머를 드래그해 시간을 설정하세요.</span>
        </div>
      </div>

      <div className="button-row" aria-label="타이머 조작">
        <button type="button" onClick={onStart} disabled={isRunning}>
          시작
        </button>
        <button type="button" onClick={onPause} disabled={!isRunning}>
          일시정지
        </button>
        <button type="button" onClick={onReset}>
          초기화
        </button>
      </div>
    </section>
  )
}
