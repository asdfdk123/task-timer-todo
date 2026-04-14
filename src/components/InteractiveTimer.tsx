import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'

const MAX_MINUTES = 60
const SNAP_MINUTES = 1
const SIZE = 280
const CENTER = SIZE / 2
const RADIUS = 126
const TICK_RADIUS = 116
const HANDLE_RADIUS = 118

type InteractiveTimerProps = {
  durationSeconds: number
  helperText: string
  isInteractive: boolean
  isRunning: boolean
  onDurationChange: (durationSeconds: number) => void
  remainingSeconds: number
  remainingTime: string
  state: 'idle' | 'running' | 'paused' | 'finished'
  stateLabel: string
}

function polarToCartesian(angle: number) {
  return {
    x: CENTER + RADIUS * Math.sin(angle),
    y: CENTER - RADIUS * Math.cos(angle),
  }
}

function clampRatio(ratio: number) {
  return Math.min(1, Math.max(0, ratio))
}

function createSectorPath(ratio: number) {
  if (ratio >= 0.999) {
    return `
      M ${CENTER} ${CENTER}
      m 0 ${-RADIUS}
      a ${RADIUS} ${RADIUS} 0 1 1 0 ${RADIUS * 2}
      a ${RADIUS} ${RADIUS} 0 1 1 0 ${-RADIUS * 2}
      Z
    `
  }

  if (ratio <= 0) {
    return ''
  }

  const angle = ratio * Math.PI * 2
  const start = polarToCartesian(0)
  const end = polarToCartesian(angle)
  const largeArcFlag = ratio > 0.5 ? 1 : 0

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ')
}

function getVisualRatio({
  durationSeconds,
  remainingSeconds,
  state,
}: {
  durationSeconds: number
  remainingSeconds: number
  state: InteractiveTimerProps['state']
}) {
  if (state === 'finished') {
    return 0
  }

  if (state === 'idle') {
    return clampRatio(durationSeconds / (MAX_MINUTES * 60))
  }

  return durationSeconds > 0 ? clampRatio(remainingSeconds / durationSeconds) : 0
}

function getMinutesFromPointer(event: PointerEvent<SVGSVGElement>, svg: SVGSVGElement) {
  const rect = svg.getBoundingClientRect()
  const x = event.clientX - rect.left - rect.width / 2
  const y = event.clientY - rect.top - rect.height / 2
  const angle = Math.atan2(y, x) + Math.PI / 2
  const normalizedAngle = (angle + Math.PI * 2) % (Math.PI * 2)
  const ratio = normalizedAngle / (Math.PI * 2)
  const minutes = Math.round((ratio * MAX_MINUTES) / SNAP_MINUTES) * SNAP_MINUTES

  return minutes === 0 ? MAX_MINUTES : Math.min(MAX_MINUTES, Math.max(SNAP_MINUTES, minutes))
}

export function InteractiveTimer({
  durationSeconds,
  helperText,
  isInteractive,
  isRunning,
  onDurationChange,
  remainingSeconds,
  remainingTime,
  state,
  stateLabel,
}: InteractiveTimerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const visualRatio = getVisualRatio({
    durationSeconds,
    remainingSeconds,
    state,
  })
  const sectorPath = createSectorPath(visualRatio)
  const selectedMinutes = Math.max(SNAP_MINUTES, Math.round(durationSeconds / 60))
  const tickAngles = Array.from({ length: 12 }, (_, index) => index * (Math.PI / 6))

  const updateDurationFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!isInteractive || isRunning || svgRef.current === null) {
      return
    }

    const minutes = getMinutesFromPointer(event, svgRef.current)
    onDurationChange(minutes * 60)
  }

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!isInteractive || isRunning) {
      return
    }

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    updateDurationFromPointer(event)
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!isDragging) {
      return
    }

    event.preventDefault()
    updateDurationFromPointer(event)
  }

  const handlePointerEnd = (event: PointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    setIsDragging(false)
  }

  return (
    <div
      className={`interactive-timer ${state}${isDragging ? ' dragging' : ''}`}
      aria-label={`타이머가 ${selectedMinutes}분으로 설정되었습니다. 남은 시간은 ${remainingTime}입니다.`}
      role="group"
    >
      <svg
        ref={svgRef}
        className="interactive-timer-face"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onLostPointerCapture={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        aria-hidden="true"
      >
        <circle className="interactive-timer-dial" cx={CENTER} cy={CENTER} r={RADIUS} />
        {tickAngles.map((angle) => {
          const outer = {
            x: CENTER + RADIUS * Math.sin(angle),
            y: CENTER - RADIUS * Math.cos(angle),
          }
          const inner = {
            x: CENTER + TICK_RADIUS * Math.sin(angle),
            y: CENTER - TICK_RADIUS * Math.cos(angle),
          }

          return (
            <line
              key={angle}
              className="interactive-timer-tick"
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
            />
          )
        })}
        {sectorPath ? <path className="interactive-timer-sector" d={sectorPath} /> : null}
        {visualRatio > 0 ? (
          <circle
            className="interactive-timer-handle"
            cx={CENTER + HANDLE_RADIUS * Math.sin(visualRatio * Math.PI * 2)}
            cy={CENTER - HANDLE_RADIUS * Math.cos(visualRatio * Math.PI * 2)}
            r="7"
          />
        ) : null}
        <circle className="interactive-timer-inner" cx={CENTER} cy={CENTER} r="54" />
        <line className="interactive-timer-marker" x1={CENTER} y1="10" x2={CENTER} y2="28" />
      </svg>

      <div className="interactive-timer-center">
        <span>{stateLabel}</span>
        <strong>{remainingTime}</strong>
        <small>{helperText}</small>
      </div>
    </div>
  )
}
