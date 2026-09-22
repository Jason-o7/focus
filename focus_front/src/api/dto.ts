import type { Background } from '@/types/background'
import {
  DEFAULT_NOTIFICATIONS,
  isNotificationKind,
  type NotificationKind,
} from '@/types/notification'
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings'
import { isValidEyeBreakMinutes } from '@/utils/eyeBreak'
import { isNonNegativeMs, isValidBreakMs, isValidFocusMs, isValidGoalMs } from '@/utils/duration'
import { dayKey } from '@/utils/day'
import type { Session } from '@/types/session'
import type { Sound } from '@/types/sound'
import type { ActiveSession, TimerMode, TimerPhase, TimerStatus } from '@/types/timer'

// #region Wire shapes
export interface SoundDto {
  id: string
  label: string
}

export interface BackgroundDto {
  id: string
  label: string
}

export interface SettingsDto {
  soundId: string
  backgroundId: string
  eyeBreakEnabled: boolean
  eyeBreakMinutes: number
  eyeBreakPresets: number[]
  mode: TimerMode
  focusMs: number
  breakMs: number
  dailyGoalMs: number
  notifications: Record<string, boolean>
  notificationPromptDismissed: boolean
}

export interface SessionDto {
  id: string
  mode: TimerMode
  startedAt: number
  endedAt: number
  focusedMs: number
  focusedByDay: Record<string, number>
}

export interface ActiveSessionDto {
  id: string
  mode: TimerMode
  phase: TimerPhase
  startedAt: number
  status: TimerStatus
  focusMs: number
  breakMs: number
  focusedMs: number
  focusedByDay: Record<string, number>
  phaseAccumulatedMs: number
  segmentStartedAt: number | null
}
// #endregion

// #region JSON to entity
function isRecord(raw: unknown): raw is Record<string, unknown> {
  return typeof raw === 'object' && raw !== null && !Array.isArray(raw)
}

function toSound(raw: unknown): Sound | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.label !== 'string') return null
  return { id: raw.id, label: raw.label }
}

export function toSoundList(raw: unknown): Sound[] {
  if (!Array.isArray(raw)) throw new Error('The sound catalog is not a list')
  return raw.map(toSound).filter((sound): sound is Sound => sound !== null)
}

// raw                    [ {id:"rain"},  {id:42},  {id:"cafe"} ]   3 elementos
//   .map(toSound)        [ Sound,        null,     Sound       ]   3 elementos
//   .filter(...)         [ Sound,                  Sound       ]   2 elementos

function toBackground(raw: unknown): Background | null {
  if (!isRecord(raw)) return null
  if (typeof raw.id !== 'string' || typeof raw.label !== 'string') return null
  return { id: raw.id, label: raw.label }
}

export function toBackgroundList(raw: unknown): Background[] {
  if (!Array.isArray(raw)) throw new Error('The background catalog is not a list')
  return raw.map(toBackground).filter((background): background is Background => background !== null)
}

function toMinuteList(raw: unknown, fallback: number[]): number[] {
  if (!Array.isArray(raw)) return [...fallback]

  const minutes = raw.filter(isValidEyeBreakMinutes)
  if (minutes.length === 0) return [...fallback]

  return [...new Set(minutes)].sort((a, b) => a - b)
}

function toNotifications(raw: unknown): Record<NotificationKind, boolean> {
  const value = { ...DEFAULT_NOTIFICATIONS }
  if (!isRecord(raw)) return value

  for (const [kind, on] of Object.entries(raw)) {
    if (isNotificationKind(kind) && typeof on === 'boolean') value[kind] = on
  }

  return value
}

export function toSettings(raw: unknown): Settings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS }

  return {
    soundId: typeof raw.soundId === 'string' ? raw.soundId : DEFAULT_SETTINGS.soundId,
    backgroundId:
      typeof raw.backgroundId === 'string' ? raw.backgroundId : DEFAULT_SETTINGS.backgroundId,
    eyeBreakEnabled:
      typeof raw.eyeBreakEnabled === 'boolean'
        ? raw.eyeBreakEnabled
        : DEFAULT_SETTINGS.eyeBreakEnabled,
    eyeBreakMinutes: isValidEyeBreakMinutes(raw.eyeBreakMinutes)
      ? raw.eyeBreakMinutes
      : DEFAULT_SETTINGS.eyeBreakMinutes,
    eyeBreakPresets: toMinuteList(raw.eyeBreakPresets, DEFAULT_SETTINGS.eyeBreakPresets),
    mode: isTimerMode(raw.mode) ? raw.mode : DEFAULT_SETTINGS.mode,
    focusMs: isValidFocusMs(raw.focusMs) ? raw.focusMs : DEFAULT_SETTINGS.focusMs,
    breakMs: isValidBreakMs(raw.breakMs) ? raw.breakMs : DEFAULT_SETTINGS.breakMs,
    dailyGoalMs: isValidGoalMs(raw.dailyGoalMs) ? raw.dailyGoalMs : DEFAULT_SETTINGS.dailyGoalMs,
    notifications: toNotifications(raw.notifications),
    notificationPromptDismissed:
      typeof raw.notificationPromptDismissed === 'boolean'
        ? raw.notificationPromptDismissed
        : DEFAULT_SETTINGS.notificationPromptDismissed,
  }
}

function isTimerMode(raw: unknown): raw is TimerMode {
  return raw === 'timer' || raw === 'stopwatch'
}

function isTimerPhase(raw: unknown): raw is TimerPhase {
  return raw === 'focus' || raw === 'break'
}

function isTimerStatus(raw: unknown): raw is TimerStatus {
  return raw === 'stopped' || raw === 'running' || raw === 'paused'
}

const FUTURE_TOLERANCE_MS = 60_000

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

const DAY_TOTAL_TOLERANCE_MS = 1000

function toDayTotals(
  raw: unknown,
  day: string,
  fallbackMs: number,
  capMs: number | null = null,
): Record<string, number> {
  const totals: Record<string, number> = {}
  let sum = 0

  if (isRecord(raw)) {
    for (const [key, ms] of Object.entries(raw)) {
      if (DAY_KEY.test(key) && isNonNegativeMs(ms)) {
        totals[key] = ms
        sum += ms
      }
    }
  }

  // Days adding up to more than the session itself would poison the goal, the streak and the debt
  const fits = capMs === null || sum <= capMs + DAY_TOTAL_TOLERANCE_MS
  if (Object.keys(totals).length > 0 && fits) return totals

  return fallbackMs > 0 ? { [day]: fallbackMs } : {}
}

export function toActiveSession(raw: unknown, at: number = Date.now()): ActiveSession | null {
  if (!isRecord(raw)) return null

  if (typeof raw.id !== 'string' || raw.id === '') return null
  if (!isTimerMode(raw.mode)) return null
  if (!isTimerPhase(raw.phase)) return null
  if (!isNonNegativeMs(raw.startedAt) || raw.startedAt > at + FUTURE_TOLERANCE_MS) return null
  if (!isTimerStatus(raw.status)) return null

  if (!isNonNegativeMs(raw.focusMs)) return null
  if (!isNonNegativeMs(raw.breakMs)) return null
  if (!isNonNegativeMs(raw.focusedMs)) return null
  if (!isNonNegativeMs(raw.phaseAccumulatedMs)) return null

  if (raw.mode === 'timer' && (!isValidFocusMs(raw.focusMs) || !isValidBreakMs(raw.breakMs))) {
    return null
  }

  const startedAt = raw.segmentStartedAt
  if (startedAt !== null) {
    if (!isNonNegativeMs(startedAt) || startedAt > at + FUTURE_TOLERANCE_MS) return null
  }

  if (raw.status === 'running' && startedAt === null) return null
  if (raw.status !== 'running' && startedAt !== null) return null

  return {
    id: raw.id,
    mode: raw.mode,
    phase: raw.phase,
    startedAt: raw.startedAt,
    status: raw.status,
    focusMs: raw.focusMs,
    breakMs: raw.breakMs,
    focusedMs: raw.focusedMs,
    focusedByDay: toDayTotals(raw.focusedByDay, dayKey(raw.startedAt), raw.focusedMs),
    phaseAccumulatedMs: raw.phaseAccumulatedMs,
    segmentStartedAt: startedAt,
  }
}
export function toSession(raw: unknown, at: number = Date.now()): Session | null {
  if (!isRecord(raw)) return null

  if (typeof raw.id !== 'string' || raw.id === '') return null
  if (!isTimerMode(raw.mode)) return null
  if (!isNonNegativeMs(raw.startedAt)) return null
  if (!isNonNegativeMs(raw.endedAt)) return null
  if (!isNonNegativeMs(raw.focusedMs)) return null

  if (raw.endedAt < raw.startedAt) return null
  if (raw.startedAt > at + FUTURE_TOLERANCE_MS) return null
  if (raw.focusedMs > raw.endedAt - raw.startedAt + FUTURE_TOLERANCE_MS) return null

  return {
    id: raw.id,
    mode: raw.mode,
    startedAt: raw.startedAt,
    endedAt: raw.endedAt,
    focusedMs: raw.focusedMs,
    focusedByDay: toDayTotals(
      raw.focusedByDay,
      dayKey(raw.startedAt),
      raw.focusedMs,
      raw.focusedMs,
    ),
  }
}

export function toSessionList(raw: unknown, at: number = Date.now()): Session[] {
  if (!Array.isArray(raw)) throw new Error('The session history is not a list')
  return raw.map((item) => toSession(item, at)).filter((s): s is Session => s !== null)
}
// #endregion

// #region Entity to JSON
export function toSettingsDto(value: Settings): SettingsDto {
  return {
    soundId: value.soundId,
    backgroundId: value.backgroundId,
    eyeBreakEnabled: value.eyeBreakEnabled,
    eyeBreakMinutes: value.eyeBreakMinutes,
    eyeBreakPresets: [...value.eyeBreakPresets],
    mode: value.mode,
    focusMs: value.focusMs,
    breakMs: value.breakMs,
    dailyGoalMs: value.dailyGoalMs,
    notifications: { ...value.notifications },
    notificationPromptDismissed: value.notificationPromptDismissed,
  }
}

export function toSessionDto(value: Session): SessionDto {
  return {
    id: value.id,
    mode: value.mode,
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    focusedMs: value.focusedMs,
    focusedByDay: { ...value.focusedByDay },
  }
}

export function toActiveSessionDto(value: ActiveSession): ActiveSessionDto {
  return {
    id: value.id,
    mode: value.mode,
    phase: value.phase,
    startedAt: value.startedAt,
    status: value.status,
    focusMs: value.focusMs,
    breakMs: value.breakMs,
    focusedMs: value.focusedMs,
    focusedByDay: { ...value.focusedByDay },
    phaseAccumulatedMs: value.phaseAccumulatedMs,
    segmentStartedAt: value.segmentStartedAt,
  }
}
// #endregion
