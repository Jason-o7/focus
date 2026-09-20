import type { TimerMode } from '@/types/timer'

/** A finished study session, as it enters the history. */
export interface Session {
  id: string
  mode: TimerMode
  startedAt: number
  endedAt: number
  focusedMs: number
  focusedByDay: Record<string, number>
}
