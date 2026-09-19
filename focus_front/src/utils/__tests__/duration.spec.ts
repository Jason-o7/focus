import { describe, expect, it } from 'vitest'
import {
  BREAK_MAX_MS,
  DEBUG_MS,
  BREAK_MIN_MS,
  FOCUS_MAX_MS,
  FOCUS_MIN_MS,
  MINUTE_MS,
  formatDuration,
  formatMinutes,
  isValidBreakMs,
  isValidFocusMs,
} from '@/utils/duration'

describe('formatDuration', () => {
  it('leaves the hours out while there are none', () => {
    expect(formatDuration(0)).toBe('00:00')
    expect(formatDuration(25 * MINUTE_MS)).toBe('25:00')
    expect(formatDuration(59 * MINUTE_MS + 59_000)).toBe('59:59')
  })

  it('adds the hours as soon as one exists', () => {
    expect(formatDuration(60 * MINUTE_MS)).toBe('01:00:00')
    expect(formatDuration(3 * 60 * MINUTE_MS + 7 * MINUTE_MS + 5_000)).toBe('03:07:05')
  })

  it('floors the leftover milliseconds', () => {
    expect(formatDuration(1_999)).toBe('00:01')
  })

  it('clamps a negative value instead of printing a minus', () => {
    expect(formatDuration(-5_000)).toBe('00:00')
  })
})

describe('formatMinutes', () => {
  it('reads as a label, not as a clock', () => {
    expect(formatMinutes(25 * MINUTE_MS)).toBe('25 min')
  })

  it('drops to seconds below a minute, so a debug duration is not "0 min"', () => {
    expect(formatMinutes(DEBUG_MS)).toBe('5 s')
  })
})

describe('duration ranges', () => {
  it('accepts the edges and rejects what is past them', () => {
    expect(isValidFocusMs(FOCUS_MIN_MS)).toBe(true)
    expect(isValidFocusMs(FOCUS_MAX_MS)).toBe(true)
    expect(isValidFocusMs(FOCUS_MIN_MS - 1)).toBe(false)
    expect(isValidFocusMs(FOCUS_MAX_MS + 1)).toBe(false)

    expect(isValidBreakMs(BREAK_MIN_MS)).toBe(true)
    expect(isValidBreakMs(BREAK_MAX_MS)).toBe(true)
    expect(isValidBreakMs(0)).toBe(false)
  })

  // TODO: remove with DEBUG_MS.
  it('lets the debug duration through both borders', () => {
    expect(isValidFocusMs(DEBUG_MS)).toBe(true)
    expect(isValidBreakMs(DEBUG_MS)).toBe(true)
    expect(isValidFocusMs(DEBUG_MS + 1)).toBe(false)
  })

  it('rejects what is not a whole number', () => {
    expect(isValidFocusMs(25.5 * MINUTE_MS + 0.5)).toBe(false)
    expect(isValidFocusMs('1500000')).toBe(false)
    expect(isValidFocusMs(Number.NaN)).toBe(false)
    expect(isValidFocusMs(null)).toBe(false)
  })
})
