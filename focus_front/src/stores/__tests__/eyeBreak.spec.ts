import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { toActiveSessionDto } from '@/api/dto'
import { useEyeBreakStore } from '@/stores/eyeBreak'
import { useNotificationsStore } from '@/stores/notifications'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useTimerStore } from '@/stores/timer'
import type { ActiveSession } from '@/types/timer'
import { playEyeBreak, scheduleEyeBreak, type CueHandle } from '@/utils/cues'
import { MINUTE_MS } from '@/utils/duration'

vi.mock('@/utils/cues', () => ({
  playOvertime: vi.fn<() => void>(),
  scheduleOvertime: vi.fn<(inSeconds: number) => CueHandle | null>(() => ({
    cancel: vi.fn<() => void>(),
  })),
  playEyeBreak: vi.fn<() => void>(),
  scheduleEyeBreak: vi.fn<(inSeconds: number) => CueHandle | null>(() => ({
    cancel: vi.fn<() => void>(),
  })),
}))

const SESSION_KEY = 'focus.activeSession'
const NOW = 1_700_000_000_000
const FOCUS_MS = 25 * MINUTE_MS
const INTERVAL_MS = 20 * MINUTE_MS

// #region The browser's bell
const shown: { title: string }[] = []

class FakeNotification {
  static permission: NotificationPermission = 'granted'

  static async requestPermission() {
    return FakeNotification.permission
  }

  onclick: (() => void) | null = null

  constructor(title: string) {
    shown.push({ title })
  }

  close() {}
}
// #endregion

function storedSession(overrides: Partial<ActiveSession> = {}) {
  const session: ActiveSession = {
    id: 'a1',
    mode: 'timer',
    phase: 'focus',
    startedAt: NOW,
    status: 'running',
    focusMs: FOCUS_MS,
    breakMs: 5 * MINUTE_MS,
    focusedMs: 0,
    focusedByDay: {},
    phaseAccumulatedMs: 0,
    segmentStartedAt: NOW,
    ...overrides,
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(toActiveSessionDto(session)))
}

// Lands the clock on NOW + offset with a single tick fired.
async function jumpTo(offsetMs: number) {
  vi.setSystemTime(NOW + offsetMs - 1000)
  await vi.advanceTimersByTimeAsync(1000)
  await nextTick()
}

/** Boots in the same order as App.vue: both stores exist before anything is read. */
async function boot() {
  const notifications = useNotificationsStore()
  const eyeBreak = useEyeBreakStore()
  const settings = useSettingsStore()
  const sessions = useSessionsStore()
  const timer = useTimerStore()

  await settings.load()
  await sessions.load()
  await timer.load()
  await nextTick()

  return { notifications, eyeBreak, settings, timer }
}

beforeEach(() => {
  localStorage.clear()
  shown.length = 0
  vi.mocked(playEyeBreak).mockClear()
  vi.mocked(scheduleEyeBreak).mockClear()
  FakeNotification.permission = 'granted'
  vi.stubGlobal('Notification', FakeNotification)
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the eye break nudge', () => {
  it('arrives once per interval of focus', async () => {
    const { settings, timer } = await boot()
    await settings.setNotification('eyeBreak', true)

    await timer.start()
    await jumpTo(INTERVAL_MS + 1000)

    expect(shown).toHaveLength(1)
    expect(shown[0]?.title).toBe('Your eyes earned a 20-second break')

    await jumpTo(INTERVAL_MS + 60_000)
    expect(shown).toHaveLength(1)

    await jumpTo(2 * INTERVAL_MS + 1000)
    expect(shown).toHaveLength(2)
  })

  it('stays quiet while the setting is off', async () => {
    const { timer } = await boot()

    await timer.start()
    await jumpTo(INTERVAL_MS + 1000)

    expect(shown).toHaveLength(0)
  })

  it('stays quiet without permission, even with the setting on', async () => {
    FakeNotification.permission = 'denied'

    const { settings, timer } = await boot()
    await settings.setNotification('eyeBreak', true)

    await timer.start()
    await jumpTo(INTERVAL_MS + 1000)

    expect(shown).toHaveLength(0)
  })

  it('does not count the time spent paused', async () => {
    const { settings, timer } = await boot()
    await settings.setNotification('eyeBreak', true)

    await timer.start()
    await jumpTo(10 * MINUTE_MS)
    await timer.pause()

    await jumpTo(INTERVAL_MS + 60_000)
    expect(shown).toHaveLength(0)

    await timer.resume()
    await jumpTo(INTERVAL_MS + 11 * MINUTE_MS)
    expect(shown).toHaveLength(1)
  })

  it('does not count the break, because resting is not focusing', async () => {
    const { settings, timer } = await boot()
    await settings.setNotification('eyeBreak', true)

    await timer.start()
    await jumpTo(10 * MINUTE_MS)
    await timer.startBreak()
    await jumpTo(40 * MINUTE_MS)

    expect(shown).toHaveLength(0)
  })

  it('says nothing about the marks a restored session already went past', async () => {
    storedSession({
      startedAt: NOW - 45 * MINUTE_MS,
      segmentStartedAt: NOW - 45 * MINUTE_MS,
    })

    const { settings } = await boot()
    await settings.setNotification('eyeBreak', true)

    await jumpTo(1000)
    expect(shown).toHaveLength(0)

    // 45 min in, the next mark is the third one, at 60
    await jumpTo(15 * MINUTE_MS + 1000)
    expect(shown).toHaveLength(1)
  })

  it('does not fire a burst when the interval is shortened mid-session', async () => {
    const { settings, timer } = await boot()
    await settings.setNotification('eyeBreak', true)

    await timer.start()
    await jumpTo(INTERVAL_MS + 1000)
    expect(shown).toHaveLength(1)

    await settings.setEyeBreakMinutes(10)
    await nextTick()
    expect(shown).toHaveLength(1)

    await jumpTo(30 * MINUTE_MS + 1000)
    expect(shown).toHaveLength(2)
  })
})

describe('the eye break cue', () => {
  it('books the sound in advance and does not play it a second time', async () => {
    const { settings, timer } = await boot()
    await settings.setNotification('eyeBreak', true)

    await timer.start()
    expect(vi.mocked(scheduleEyeBreak)).toHaveBeenCalledWith(INTERVAL_MS / 1000)

    await jumpTo(INTERVAL_MS + 1000)
    expect(vi.mocked(playEyeBreak)).not.toHaveBeenCalled()
  })

  it('plays the sound at the mark when the booking was refused', async () => {
    vi.mocked(scheduleEyeBreak).mockReturnValue(null)

    const { settings, timer } = await boot()
    await settings.setNotification('eyeBreak', true)

    await timer.start()
    await jumpTo(INTERVAL_MS + 1000)

    expect(vi.mocked(playEyeBreak)).toHaveBeenCalledTimes(1)

    vi.mocked(scheduleEyeBreak).mockReturnValue({ cancel: vi.fn<() => void>() })
  })

  it('calls the booking off when the session is paused', async () => {
    const cancel = vi.fn<() => void>()
    vi.mocked(scheduleEyeBreak).mockReturnValueOnce({ cancel })

    const { settings, timer } = await boot()
    await settings.setNotification('eyeBreak', true)

    await timer.start()
    await timer.pause()

    expect(cancel).toHaveBeenCalled()
  })
})
