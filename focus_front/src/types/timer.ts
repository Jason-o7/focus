/** Lifecycle of a study session. */
export type TimerStatus = 'stopped' | 'running' | 'paused'

/** Counting down to a target, or counting up with no end. */
export type TimerMode = 'timer' | 'stopwatch'

/** What the clock is counting. */
export type TimerPhase = 'focus' | 'break'

/** A session in progress, in the shape that survives a closed tab. */
export interface ActiveSession {
  id: string
  mode: TimerMode
  phase: TimerPhase
  status: TimerStatus
  focusMs: number
  breakMs: number
  focusedMs: number
  phaseAccumulatedMs: number
  segmentStartedAt: number | null
}
