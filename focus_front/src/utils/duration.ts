export const MINUTE_MS = 60_000

export const FOCUS_MIN_MS = 5 * MINUTE_MS
export const FOCUS_MAX_MS = 120 * MINUTE_MS
export const BREAK_MIN_MS = 1 * MINUTE_MS
export const BREAK_MAX_MS = 30 * MINUTE_MS

export const GOAL_MIN_MS = 1 * MINUTE_MS
export const GOAL_MAX_MS = 12 * 60 * MINUTE_MS

// TODO: remove. A 5 second duration, to watch what a session does when it runs out.
export const DEBUG_MS = 5_000

export function isNonNegativeMs(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

export function isValidFocusMs(value: unknown): value is number {
  if (value === DEBUG_MS) return true
  return isNonNegativeMs(value) && value >= FOCUS_MIN_MS && value <= FOCUS_MAX_MS
}

export function isValidGoalMs(value: unknown): value is number {
  return isNonNegativeMs(value) && value >= GOAL_MIN_MS && value <= GOAL_MAX_MS
}

export function isValidBreakMs(value: unknown): value is number {
  if (value === DEBUG_MS) return true
  return isNonNegativeMs(value) && value >= BREAK_MIN_MS && value <= BREAK_MAX_MS
}

/** mm:ss, and the hours only once there are any. Every field is two digits. */
export function formatDuration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const rest = seconds % 60

  const tail = `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
  return hours === 0 ? tail : `${String(hours).padStart(2, '0')}:${tail}`
}

/** Short label for the duration buttons. */
export function formatMinutes(ms: number): string {
  if (ms < MINUTE_MS) return `${Math.round(ms / 1000)} s`
  return `${Math.round(ms / MINUTE_MS)} min`
}
