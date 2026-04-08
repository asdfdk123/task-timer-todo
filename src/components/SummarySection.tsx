type SummaryCard = {
  label: string
  value: string
  description: string
  emphasizeText?: boolean
}

type SummarySectionProps = {
  cards: SummaryCard[]
}

export function SummarySection({ cards }: SummarySectionProps) {
  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <article key={card.label} className="panel summary-card">
          <p className="section-label">{card.label}</p>
          <strong className={card.emphasizeText ? 'summary-text' : undefined}>{card.value}</strong>
          <span>{card.description}</span>
        </article>
      ))}
    </section>
  )
}
