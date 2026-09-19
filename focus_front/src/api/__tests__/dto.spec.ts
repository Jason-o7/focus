import { describe, expect, it } from 'vitest'
import { toActiveSession, toActiveSessionDto, toSettings } from '@/api/dto'
import { DEFAULT_SETTINGS } from '@/types/settings'
import type { ActiveSession } from '@/types/timer'
import { MINUTE_MS } from '@/utils/duration'

const NOW = 1_700_000_000_000

function validSession(overrides: Partial<ActiveSession> = {}): ActiveSession {
  return {
    id: 'a1',
    mode: 'timer',
    phase: 'focus',
    status: 'running',
    focusMs: 25 * MINUTE_MS,
    breakMs: 5 * MINUTE_MS,
    focusedMs: 0,
    phaseAccumulatedMs: 0,
    segmentStartedAt: NOW - 60_000,
    ...overrides,
  }
}

describe('toActiveSession', () => {
  it('accepts a session it wrote itself', () => {
    const session = validSession()
    expect(toActiveSession(toActiveSessionDto(session), NOW)).toEqual(session)
  })

  it('accepts a paused session with no open segment', () => {
    const session = validSession({
      status: 'paused',
      segmentStartedAt: null,
      phaseAccumulatedMs: 120_000,
    })
    expect(toActiveSession(toActiveSessionDto(session), NOW)).toEqual(session)
  })

  it('rejects anything that is not an object', () => {
    expect(toActiveSession(null, NOW)).toBeNull()
    expect(toActiveSession('hola', NOW)).toBeNull()
    expect(toActiveSession(42, NOW)).toBeNull()
    expect(toActiveSession([], NOW)).toBeNull()
  })

  it('rejects a value outside its enum', () => {
    expect(toActiveSession(validSession({ mode: 'chronometer' as never }), NOW)).toBeNull()
    expect(toActiveSession(validSession({ phase: 'rest' as never }), NOW)).toBeNull()
    expect(toActiveSession(validSession({ status: 'idle' as never }), NOW)).toBeNull()
  })

  it('rejects impossible numbers', () => {
    expect(toActiveSession(validSession({ phaseAccumulatedMs: -1 }), NOW)).toBeNull()
    expect(toActiveSession(validSession({ focusedMs: Number.NaN }), NOW)).toBeNull()
    expect(toActiveSession(validSession({ focusMs: 3 * MINUTE_MS }), NOW)).toBeNull()
  })

  it('lets the stopwatch keep its durations at zero', () => {
    const session = validSession({ mode: 'stopwatch', focusMs: 0, breakMs: 0 })
    expect(toActiveSession(toActiveSessionDto(session), NOW)).toEqual(session)
  })

  it('rejects a segment that started in the future beyond the clock tolerance', () => {
    expect(toActiveSession(validSession({ segmentStartedAt: NOW + 30_000 }), NOW)).not.toBeNull()
    expect(toActiveSession(validSession({ segmentStartedAt: NOW + 120_000 }), NOW)).toBeNull()
  })

  it('rejects a status that contradicts the segment', () => {
    expect(
      toActiveSession(validSession({ status: 'running', segmentStartedAt: null }), NOW),
    ).toBeNull()
    expect(toActiveSession(validSession({ status: 'paused' }), NOW)).toBeNull()
  })

  it('keeps a stored stopped session, which the store then discards', () => {
    const session = validSession({ status: 'stopped', segmentStartedAt: null })
    expect(toActiveSession(toActiveSessionDto(session), NOW)).toEqual(session)
  })
})

describe('toSettings', () => {
  it('falls back to the defaults field by field', () => {
    const settings = toSettings({ mode: 'sundial', focusMs: 3 * MINUTE_MS, soundId: 'forest' })

    expect(settings.mode).toBe(DEFAULT_SETTINGS.mode)
    expect(settings.focusMs).toBe(DEFAULT_SETTINGS.focusMs)
    expect(settings.soundId).toBe('forest')
  })
})
