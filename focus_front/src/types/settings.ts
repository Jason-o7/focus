import {
  DEFAULT_NOTIFICATIONS,
  DEFAULT_PROMPTS_DISMISSED,
  type NotificationKind,
} from '@/types/notification'
import type { TimerMode } from '@/types/timer'
import { MINUTE_MS } from '@/utils/duration'

/** User preferences for a session. */
export interface Settings {
  soundId: string
  backgroundId: string
  eyeBreakMinutes: number
  eyeBreakPresets: number[]
  mode: TimerMode
  focusMs: number
  breakMs: number
  dailyGoalMs: number
  notifications: Record<NotificationKind, boolean>
  promptsDismissed: Record<NotificationKind, boolean>
}

export const DEFAULT_SETTINGS: Settings = {
  soundId: 'rain',
  backgroundId: 'dusk',
  eyeBreakMinutes: 20,
  eyeBreakPresets: [10, 15, 20],
  mode: 'timer',
  focusMs: 25 * MINUTE_MS,
  breakMs: 5 * MINUTE_MS,
  // TODO: back to 2 * 60 * MINUTE_MS. Lowered to watch a session go past the bar.
  dailyGoalMs: 1 * MINUTE_MS,
  notifications: { ...DEFAULT_NOTIFICATIONS },
  promptsDismissed: { ...DEFAULT_PROMPTS_DISMISSED },
}
