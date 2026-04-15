type CompletionToastProps = {
  message: string | null
}

export function CompletionToast({ message }: CompletionToastProps) {
  if (!message) {
    return null
  }

  return (
    <div className="completion-toast" role="status" aria-live="polite">
      <strong>집중 완료</strong>
      <p>{message}</p>
    </div>
  )
}
