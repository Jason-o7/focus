import type { TimerMode } from '@/types/timer'
import { MINUTE_MS } from '@/utils/duration'

/** User preferences for a session. */
export interface Settings {
  soundId: string
  backgroundId: string
  eyeBreakEnabled: boolean
  eyeBreakMinutes: number
  eyeBreakPresets: number[]
  mode: TimerMode
  focusMs: number
  breakMs: number
}

export const DEFAULT_SETTINGS: Settings = {
  soundId: 'rain',
  backgroundId: 'dusk',
  eyeBreakEnabled: true,
  eyeBreakMinutes: 20,
  eyeBreakPresets: [10, 15, 20],
  mode: 'timer',
  focusMs: 25 * MINUTE_MS,
  breakMs: 5 * MINUTE_MS,
}
