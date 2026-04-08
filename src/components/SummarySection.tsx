type SummarySectionProps = {
  totalCount: number
  completedCount: number
  focusLabel: string
}

export function SummarySection({
  totalCount,
  completedCount,
  focusLabel,
}: SummarySectionProps) {
  return (
    <section className="summary-grid">
      <article className="panel summary-card">
        <p className="section-label">Summary</p>
        <strong>{totalCount}</strong>
        <span>Total Tasks</span>
      </article>

      <article className="panel summary-card">
        <p className="section-label">Completed</p>
        <strong>{completedCount}</strong>
        <span>Tasks Done</span>
      </article>

      <article className="panel summary-card">
        <p className="section-label">Focus</p>
        <strong className="summary-text">{focusLabel}</strong>
        <span>Current Highlight</span>
      </article>
    </section>
  )
}
