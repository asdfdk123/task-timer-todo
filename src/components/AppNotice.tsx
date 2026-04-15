type AppNoticeProps = {
  children: string
  title: string
}

export function AppNotice({ children, title }: AppNoticeProps) {
  return (
    <aside className="app-notice" role="status" aria-live="polite">
      <strong>{title}</strong>
      <p>{children}</p>
    </aside>
  )
}
