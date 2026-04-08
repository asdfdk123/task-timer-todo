type ActiveTaskCardProps = {
  title: string
  elapsedTime: string
  isRunning: boolean
  onPause: () => void
  onStart: () => void
  onStop: () => void
}

export function ActiveTaskCard({
  title,
  elapsedTime,
  isRunning,
  onPause,
  onStart,
  onStop,
}: ActiveTaskCardProps) {
  return (
    <section className="panel active-task-section">
      <div className="section-heading">
        <p className="section-label">Current Active Task</p>
        <h2>{title}</h2>
      </div>

      <div className="active-task-timer">
        <span className="timer-caption">Elapsed Time</span>
        <strong>{elapsedTime}</strong>
      </div>

      <div className="button-row" aria-label="Timer controls">
        <button type="button" onClick={onStart} disabled={isRunning}>
          Start
        </button>
        <button type="button" onClick={onPause} disabled={!isRunning}>
          Pause
        </button>
        <button type="button" onClick={onStop}>
          Stop
        </button>
      </div>
    </section>
  )
}
