export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
}

export function formatReadableDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds)
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  const parts = [
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    hours === 0 ? `${seconds}s` : null,
  ].filter(Boolean)

  return parts.join(' ') || '0s'
}

export function getLocalDateKey(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function getTodayElapsedSeconds(startedAt: number, now: number) {
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  const effectiveStart = Math.max(startedAt, startOfToday.getTime())
  return Math.max(0, Math.floor((now - effectiveStart) / 1000))
}
