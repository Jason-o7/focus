import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toActiveSessionDto } from '@/api/dto'
import { useSettingsStore } from '@/stores/settings'
import { useTimerStore } from '@/stores/timer'
import type { ActiveSession } from '@/types/timer'
import { formatDuration, MINUTE_MS } from '@/utils/duration'

const KEY = 'focus.activeSession'
const NOW = 1_700_000_000_000

function storedSession(overrides: Partial<ActiveSession> = {}) {
  const session: ActiveSession = {
    id: 'a1',
    mode: 'timer',
    phase: 'focus',
    status: 'running',
    focusMs: 25 * MINUTE_MS,
    breakMs: 5 * MINUTE_MS,
    focusedMs: 0,
    phaseAccumulatedMs: 0,
    segmentStartedAt: NOW,
    ...overrides,
  }
  localStorage.setItem(KEY, JSON.stringify(toActiveSessionDto(session)))
}

// Lands the clock on NOW + offset with a single tick fired.
async function jumpTo(offsetMs: number) {
  vi.setSystemTime(NOW + offsetMs - 1000)
  await vi.advanceTimersByTimeAsync(1000)
}

function readStored() {
  const raw = localStorage.getItem(KEY)
  return raw === null ? null : JSON.parse(raw)
}

async function loadedStores() {
  const settings = useSettingsStore()
  const timer = useTimerStore()
  await settings.load()
  await timer.load()
  return { settings, timer }
}

beforeEach(() => {
  localStorage.clear()
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('loading', () => {
  it('stays stopped when there is nothing stored', async () => {
    const { timer } = await loadedStores()

    expect(timer.status).toBe('stopped')
    expect(timer.loaded).toBe(true)
  })

  it('resumes a running session and counts the time the tab was closed', async () => {
    storedSession({ segmentStartedAt: NOW - 10 * MINUTE_MS })
    vi.setSystemTime(NOW)

    const { timer } = await loadedStores()

    expect(timer.status).toBe('running')
    expect(timer.elapsedMs).toBe(10 * MINUTE_MS)
    expect(timer.remainingMs).toBe(15 * MINUTE_MS)
  })

  it('restores a paused session as paused', async () => {
    storedSession({ status: 'paused', segmentStartedAt: null, phaseAccumulatedMs: 4 * MINUTE_MS })

    const { timer } = await loadedStores()

    expect(timer.status).toBe('paused')
    expect(timer.elapsedMs).toBe(4 * MINUTE_MS)
  })

  it('discards a stored stopped session and clears the key', async () => {
    storedSession({ status: 'stopped', segmentStartedAt: null })

    const { timer } = await loadedStores()

    expect(timer.status).toBe('stopped')
    expect(readStored()).toBeNull()
  })

  it('ignores a corrupted session', async () => {
    localStorage.setItem(KEY, '{"id":"a1","mode":"sundial"}')

    const { timer } = await loadedStores()

    expect(timer.status).toBe('stopped')
    expect(timer.loadFailed).toBe(false)
  })
})

describe('the clock', () => {
  it('measures with timestamps, not with ticks', async () => {
    const { timer } = await loadedStores()
    await timer.start()

    await jumpTo(5 * MINUTE_MS)

    expect(timer.elapsedMs).toBe(5 * MINUTE_MS)
  })

  it('does not count the paused time', async () => {
    const { timer } = await loadedStores()
    await timer.start()

    vi.setSystemTime(NOW + 5 * MINUTE_MS)
    await timer.pause()

    vi.setSystemTime(NOW + 25 * MINUTE_MS)
    await timer.resume()

    await jumpTo(30 * MINUTE_MS)

    expect(timer.elapsedMs).toBe(10 * MINUTE_MS)
  })

  it('skips no second when the tick lands late', async () => {
    const { timer } = await loadedStores()
    await timer.start()

    await jumpTo(1003)

    expect(formatDuration(timer.displayMs)).toBe('24:59')
  })

  it('shows the full duration on the first frame', async () => {
    const { timer } = await loadedStores()
    await timer.start()

    expect(formatDuration(timer.displayMs)).toBe('25:00')
  })

  it('rounds the stopwatch down, so no second is shown before it passed', async () => {
    const { settings, timer } = await loadedStores()
    await settings.selectMode('stopwatch')
    await timer.start()

    await jumpTo(1003)

    expect(formatDuration(timer.displayMs)).toBe('00:01')
  })

  it('keeps counting up past the target instead of stopping', async () => {
    const { timer } = await loadedStores()
    await timer.start()

    await jumpTo(27 * MINUTE_MS)

    expect(timer.isOvertime).toBe(true)
    expect(timer.status).toBe('running')
    expect(timer.displayMs).toBe(2 * MINUTE_MS)
  })

  it('has no target in stopwatch mode', async () => {
    const { settings, timer } = await loadedStores()
    await settings.selectMode('stopwatch')
    await timer.start()

    await jumpTo(90 * MINUTE_MS)

    expect(timer.targetMs).toBeNull()
    expect(timer.isOvertime).toBe(false)
    expect(timer.displayMs).toBe(90 * MINUTE_MS)
  })
})

describe('the session', () => {
  it('freezes the durations it started with', async () => {
    const { settings, timer } = await loadedStores()
    await timer.start()

    await settings.setFocusMs(90 * MINUTE_MS)

    expect(timer.targetMs).toBe(25 * MINUTE_MS)
    expect(settings.focusMs).toBe(90 * MINUTE_MS)
  })

  it('writes on every transition', async () => {
    const { timer } = await loadedStores()

    await timer.start()
    expect(readStored().status).toBe('running')

    vi.setSystemTime(NOW + MINUTE_MS)
    await timer.pause()
    expect(readStored().status).toBe('paused')
    expect(readStored().phaseAccumulatedMs).toBe(MINUTE_MS)
    expect(readStored().segmentStartedAt).toBeNull()

    await timer.resume()
    expect(readStored().status).toBe('running')
  })

  it('credits the focus and resets the accumulator when the break starts', async () => {
    const { timer } = await loadedStores()
    await timer.start()

    vi.setSystemTime(NOW + 26 * MINUTE_MS)
    await timer.startBreak()

    expect(timer.focusedMs).toBe(26 * MINUTE_MS)
    expect(timer.phase).toBe('break')
    expect(timer.elapsedMs).toBe(0)
    expect(timer.targetMs).toBe(5 * MINUTE_MS)
    expect(timer.canStartBreak).toBe(false)
  })

  it('freezes the break when the break starts, not when the focus starts', async () => {
    const { settings, timer } = await loadedStores()
    await timer.start()

    await settings.setBreakMs(15 * MINUTE_MS)

    vi.setSystemTime(NOW + 26 * MINUTE_MS)
    await timer.startBreak()

    expect(timer.targetMs).toBe(15 * MINUTE_MS)
  })

  it('offers no break in stopwatch mode', async () => {
    const { settings, timer } = await loadedStores()
    await settings.selectMode('stopwatch')
    await timer.start()

    expect(timer.canStartBreak).toBe(false)
    await timer.startBreak()
    expect(timer.phase).toBe('focus')
  })

  it('clears the stored session on stop', async () => {
    const { timer } = await loadedStores()
    await timer.start()

    vi.setSystemTime(NOW + 12 * MINUTE_MS)
    await timer.stop()

    expect(timer.status).toBe('stopped')
    expect(readStored()).toBeNull()
  })

  it('refuses to start before a successful read', () => {
    const timer = useTimerStore()

    expect(timer.canEdit).toBe(false)
    timer.start()
    expect(timer.status).toBe('stopped')
  })
})
