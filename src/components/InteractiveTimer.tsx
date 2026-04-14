import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'

const MAX_MINUTES = 60
const SNAP_MINUTES = 5
const SIZE = 280
const CENTER = SIZE / 2
const RADIUS = 126

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
  const remainingRatio = durationSeconds > 0 ? remainingSeconds / durationSeconds : 0
  const sectorPath = createSectorPath(Math.min(1, Math.max(0, remainingRatio)))
  const selectedMinutes = Math.max(SNAP_MINUTES, Math.round(durationSeconds / 60))

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

    event.currentTarget.setPointerCapture(event.pointerId)
    setIsDragging(true)
    updateDurationFromPointer(event)
  }

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!isDragging) {
      return
    }

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
      className={`interactive-timer ${state}`}
      aria-label={`타이머가 ${selectedMinutes}분으로 설정되었습니다. 남은 시간은 ${remainingTime}입니다.`}
      role="group"
    >
      <svg
        ref={svgRef}
        className="interactive-timer-face"
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        onPointerCancel={handlePointerEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        aria-hidden="true"
      >
        <circle className="interactive-timer-dial" cx={CENTER} cy={CENTER} r={RADIUS} />
        {sectorPath ? <path className="interactive-timer-sector" d={sectorPath} /> : null}
        <circle className="interactive-timer-inner" cx={CENTER} cy={CENTER} r="68" />
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
