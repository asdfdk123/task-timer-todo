type ActiveTaskCardProps = {
  title: string
  elapsedTime: string
}

export function ActiveTaskCard({ title, elapsedTime }: ActiveTaskCardProps) {
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
        <button type="button">Start</button>
        <button type="button">Pause</button>
        <button type="button">Stop</button>
      </div>
    </section>
  )
}
