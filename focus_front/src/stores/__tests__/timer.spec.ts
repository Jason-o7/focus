import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toActiveSessionDto } from '@/api/dto'
import { useSessionsStore } from '@/stores/sessions'
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
    startedAt: NOW,
    status: 'running',
    focusMs: 25 * MINUTE_MS,
    breakMs: 5 * MINUTE_MS,
    focusedMs: 0,
    focusedByDay: {},
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
  const sessions = useSessionsStore()
  const timer = useTimerStore()
  await settings.load()
  await sessions.load()
  await timer.load()
  return { settings, sessions, timer }
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

  it('is never in overtime while stopped', async () => {
    const { timer } = await loadedStores()

    expect(timer.status).toBe('stopped')
    expect(timer.isOvertime).toBe(false)

    await timer.start()
    await jumpTo(27 * MINUTE_MS)
    await timer.stop()

    expect(timer.isOvertime).toBe(false)
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

  it('writes the finished session to the history', async () => {
    const { sessions, timer } = await loadedStores()
    await timer.start()

    vi.setSystemTime(NOW + 40 * MINUTE_MS)
    await timer.stop()

    expect(sessions.items).toHaveLength(1)
    expect(sessions.items[0]?.focusedMs).toBe(40 * MINUTE_MS)
    expect(sessions.items[0]?.startedAt).toBe(NOW)
    expect(sessions.todayMs).toBe(40 * MINUTE_MS)
    expect(JSON.parse(localStorage.getItem('focus.sessions') ?? '[]')).toHaveLength(1)
  })

  it('does not record a misclick', async () => {
    const { sessions, timer } = await loadedStores()
    await timer.start()
    await timer.stop()

    expect(sessions.items).toHaveLength(0)
  })

  it('credits only the focus, not the break', async () => {
    const { sessions, timer } = await loadedStores()
    await timer.start()

    vi.setSystemTime(NOW + 26 * MINUTE_MS)
    await timer.startBreak()

    vi.setSystemTime(NOW + 31 * MINUTE_MS)
    await timer.stop()

    expect(sessions.items[0]?.focusedMs).toBe(26 * MINUTE_MS)
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

describe('crossing midnight', () => {
  const EVENING = new Date(2026, 8, 19, 23, 40).getTime()

  beforeEach(() => {
    vi.setSystemTime(EVENING)
  })

  it('gives each day the minutes that ran in it', async () => {
    const { settings, sessions, timer } = await loadedStores()
    await settings.selectMode('stopwatch')
    await timer.start()

    vi.setSystemTime(new Date(2026, 8, 20, 0, 20).getTime())
    await timer.stop()

    expect(sessions.items[0]?.focusedByDay).toEqual({
      '2026-09-19': 20 * MINUTE_MS,
      '2026-09-20': 20 * MINUTE_MS,
    })
    expect(sessions.dailyTotals.get('2026-09-19')).toBe(20 * MINUTE_MS)
    expect(sessions.todayMs).toBe(20 * MINUTE_MS)
  })

  it('does not credit a pause that straddles midnight', async () => {
    const { settings, sessions, timer } = await loadedStores()
    await settings.selectMode('stopwatch')
    await timer.start()

    vi.setSystemTime(new Date(2026, 8, 19, 23, 50).getTime())
    await timer.pause()

    vi.setSystemTime(new Date(2026, 8, 20, 0, 50).getTime())
    await timer.resume()

    vi.setSystemTime(new Date(2026, 8, 20, 1, 5).getTime())
    await timer.stop()

    expect(sessions.items[0]?.focusedMs).toBe(25 * MINUTE_MS)
    expect(sessions.items[0]?.focusedByDay).toEqual({
      '2026-09-19': 10 * MINUTE_MS,
      '2026-09-20': 15 * MINUTE_MS,
    })
  })

  it('survives a reload in the middle', async () => {
    const { settings, timer } = await loadedStores()
    await settings.selectMode('stopwatch')
    await timer.start()

    vi.setSystemTime(new Date(2026, 8, 20, 0, 10).getTime())
    await timer.pause()

    setActivePinia(createPinia())
    const reloaded = await loadedStores()

    vi.setSystemTime(new Date(2026, 8, 20, 0, 30).getTime())
    await reloaded.timer.resume()

    vi.setSystemTime(new Date(2026, 8, 20, 0, 45).getTime())
    await reloaded.timer.stop()

    expect(reloaded.sessions.items[0]?.focusedByDay).toEqual({
      '2026-09-19': 20 * MINUTE_MS,
      '2026-09-20': 25 * MINUTE_MS,
    })
  })
})

describe('a failed write', () => {
  function breakWrite(key: string) {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('storage is full')
      original.call(this, name, value)
    }
    return () => (Storage.prototype.setItem = original)
  }

  function breakRemove(key: string) {
    const original = Storage.prototype.removeItem
    Storage.prototype.removeItem = function (name) {
      if (name === key) throw new Error('storage is full')
      original.call(this, name)
    }
    return () => (Storage.prototype.removeItem = original)
  }

  it('keeps the session alive instead of dropping the time', async () => {
    const { sessions, timer } = await loadedStores()
    await timer.start()

    vi.setSystemTime(NOW + 40 * MINUTE_MS)
    const repair = breakWrite('focus.sessions')
    await timer.stop()

    expect(timer.status).toBe('running')
    expect(timer.saveFailed).toBe(true)
    expect(sessions.items).toHaveLength(0)
    expect(readStored()).not.toBeNull()

    repair()
    await timer.stop()

    expect(timer.status).toBe('stopped')
    expect(timer.saveFailed).toBe(false)
    expect(sessions.items[0]?.focusedMs).toBe(40 * MINUTE_MS)
  })

  it('does not resurrect a session already in the history', async () => {
    const { timer } = await loadedStores()
    await timer.start()

    vi.setSystemTime(NOW + 40 * MINUTE_MS)
    const repair = breakRemove('focus.activeSession')
    await timer.stop()
    repair()

    expect(readStored()).not.toBeNull()

    setActivePinia(createPinia())
    const reloaded = await loadedStores()

    expect(reloaded.timer.status).toBe('stopped')
    expect(reloaded.sessions.items).toHaveLength(1)
    expect(readStored()).toBeNull()
  })
})
