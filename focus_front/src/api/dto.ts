import type { Background } from '@/types/background'
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings'
import { isValidEyeBreakMinutes } from '@/utils/eyeBreak'
import type { Sound } from '@/types/sound'

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
  }
}
// #endregion
