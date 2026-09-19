import type { Background } from '@/types/background'
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings'
import { isValidEyeBreakMinutes } from '@/utils/eyeBreak'
import { isNonNegativeMs, isValidBreakMs, isValidFocusMs } from '@/utils/duration'
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
}

export interface ActiveSessionDto {
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

export function toActiveSession(raw: unknown, at: number = Date.now()): ActiveSession | null {
  if (!isRecord(raw)) return null

  if (typeof raw.id !== 'string' || raw.id === '') return null
  if (!isTimerMode(raw.mode)) return null
  if (!isTimerPhase(raw.phase)) return null
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
    status: raw.status,
    focusMs: raw.focusMs,
    breakMs: raw.breakMs,
    focusedMs: raw.focusedMs,
    phaseAccumulatedMs: raw.phaseAccumulatedMs,
    segmentStartedAt: startedAt,
  }
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
  }
}

export function toActiveSessionDto(value: ActiveSession): ActiveSessionDto {
  return {
    id: value.id,
    mode: value.mode,
    phase: value.phase,
    status: value.status,
    focusMs: value.focusMs,
    breakMs: value.breakMs,
    focusedMs: value.focusedMs,
    phaseAccumulatedMs: value.phaseAccumulatedMs,
    segmentStartedAt: value.segmentStartedAt,
  }
}
// #endregion
