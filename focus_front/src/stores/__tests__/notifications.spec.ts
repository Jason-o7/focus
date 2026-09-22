import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { toActiveSessionDto } from '@/api/dto'
import { useNotificationsStore } from '@/stores/notifications'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useTimerStore } from '@/stores/timer'
import type { ActiveSession } from '@/types/timer'
import { playOvertime, scheduleOvertime, type CueHandle } from '@/utils/cues'
import { MINUTE_MS } from '@/utils/duration'

vi.mock('@/utils/cues', () => ({
  playOvertime: vi.fn<() => void>(),
  scheduleOvertime: vi.fn<(inSeconds: number) => CueHandle | null>(() => ({
    cancel: vi.fn<() => void>(),
  })),
}))

const SESSION_KEY = 'focus.activeSession'
const NOW = 1_700_000_000_000
const FOCUS_MS = 25 * MINUTE_MS

// #region The browser's bell
interface Shown {
  title: string
  options?: NotificationOptions
}

const shown: Shown[] = []

class FakeNotification {
  static permission: NotificationPermission = 'default'
  static answer: NotificationPermission = 'granted'

  static async requestPermission() {
    FakeNotification.permission = FakeNotification.answer
    return FakeNotification.permission
  }

  onclick: (() => void) | null = null

  constructor(title: string, options?: NotificationOptions) {
    shown.push({ title, options })
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

/** Boots in the same order as App.vue: the store exists before anything is read. */
async function boot() {
  const notifications = useNotificationsStore()
  const settings = useSettingsStore()
  const sessions = useSessionsStore()
  const timer = useTimerStore()

  await settings.load()
  await sessions.load()
  await timer.load()
  await nextTick()

  return { notifications, settings, timer }
}

beforeEach(() => {
  localStorage.clear()
  shown.length = 0
  vi.mocked(playOvertime).mockClear()
  vi.mocked(scheduleOvertime).mockClear()
  FakeNotification.permission = 'granted'
  FakeNotification.answer = 'granted'
  vi.stubGlobal('Notification', FakeNotification)
  setActivePinia(createPinia())
  vi.useFakeTimers()
  vi.setSystemTime(NOW)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('the timer reaching zero', () => {
  it('notifies once when the session crosses zero', async () => {
    const { notifications, settings, timer } = await boot()
    await settings.setNotification('timerEnd', true)
    expect(notifications.access).toBe('granted')

    await timer.start()
    await jumpTo(FOCUS_MS + 1000)

    expect(shown).toHaveLength(1)
    expect(shown[0]?.title).toBe('Bonus time!')

    await jumpTo(FOCUS_MS + 60_000)
    expect(shown).toHaveLength(1)
  })

  it('notifies again when the break runs out, with its own wording', async () => {
    const { settings, timer } = await boot()
    await settings.setNotification('timerEnd', true)

    await timer.start()
    await jumpTo(FOCUS_MS + 1000)
    await timer.startBreak()
    await jumpTo(FOCUS_MS + 1000 + settings.breakMs + 1000)

    expect(shown).toHaveLength(2)
    expect(shown[1]?.title).toBe("Break's over")
  })

  it('stays quiet while the setting is off', async () => {
    const { timer } = await boot()

    await timer.start()
    await jumpTo(FOCUS_MS + 1000)

    expect(shown).toHaveLength(0)
  })

  it('stays quiet without permission, even with the setting on', async () => {
    FakeNotification.permission = 'denied'

    const { settings, timer } = await boot()
    await settings.setNotification('timerEnd', true)

    await timer.start()
    await jumpTo(FOCUS_MS + 1000)

    expect(shown).toHaveLength(0)
  })

  it('says nothing about a session that came back already past zero', async () => {
    storedSession({ startedAt: NOW - FOCUS_MS - MINUTE_MS, segmentStartedAt: NOW - FOCUS_MS })

    const { settings } = await boot()
    await settings.setNotification('timerEnd', true)
    await jumpTo(1000)

    expect(shown).toHaveLength(0)
  })
})

describe('the cue at zero', () => {
  it('books the sound in advance and does not play it a second time', async () => {
    const { timer } = await boot()

    await timer.start()
    expect(vi.mocked(scheduleOvertime)).toHaveBeenCalledWith(FOCUS_MS / 1000)

    await jumpTo(FOCUS_MS + 1000)
    expect(vi.mocked(playOvertime)).not.toHaveBeenCalled()
  })

  it('plays the sound at the crossing when the booking was refused', async () => {
    vi.mocked(scheduleOvertime).mockReturnValueOnce(null)

    const { timer } = await boot()

    await timer.start()
    await jumpTo(FOCUS_MS + 1000)

    expect(vi.mocked(playOvertime)).toHaveBeenCalledTimes(1)
  })

  it('calls the booking off when the session is paused', async () => {
    const cancel = vi.fn<() => void>()
    vi.mocked(scheduleOvertime).mockReturnValueOnce({ cancel })

    const { timer } = await boot()

    await timer.start()
    await timer.pause()

    expect(cancel).toHaveBeenCalled()
  })

  it('says nothing about a session that came back already past zero', async () => {
    storedSession({ startedAt: NOW - FOCUS_MS - MINUTE_MS, segmentStartedAt: NOW - FOCUS_MS })

    await boot()
    await jumpTo(1000)

    expect(vi.mocked(playOvertime)).not.toHaveBeenCalled()
  })
})

describe('the prompt', () => {
  it('takes the click over while an answer is missing, and holds the session back', async () => {
    FakeNotification.permission = 'default'

    const { notifications, timer } = await boot()

    expect(notifications.promptBeforeStart()).toBe(true)
    expect(notifications.asking).toBe('timerEnd')
    expect(timer.status).toBe('stopped')
  })

  it('asks one kind at a time and starts the session on the last answer', async () => {
    FakeNotification.permission = 'default'

    const { notifications, settings, timer } = await boot()
    notifications.promptBeforeStart()

    await notifications.acceptPrompt(false)
    expect(notifications.asking).toBe('eyeBreak')
    expect(timer.status).toBe('stopped')

    await notifications.acceptPrompt(false)
    expect(notifications.promptOpen).toBe(false)
    expect(timer.status).toBe('running')
    expect(settings.notifications).toEqual({ timerEnd: true, eyeBreak: true })
  })

  it('still asks about the eye break after a plain no to the timer', async () => {
    FakeNotification.permission = 'default'

    const { notifications, settings, timer } = await boot()
    notifications.promptBeforeStart()

    await notifications.declinePrompt(false)
    expect(notifications.asking).toBe('eyeBreak')
    expect(notifications.access).toBe('default')

    await notifications.acceptPrompt(false)
    expect(settings.notifications).toEqual({ timerEnd: false, eyeBreak: true })
    expect(timer.status).toBe('running')
  })

  it('drops the rest of the queue when the browser refuses', async () => {
    FakeNotification.permission = 'default'
    FakeNotification.answer = 'denied'

    const { notifications, timer } = await boot()
    notifications.promptBeforeStart()
    await notifications.acceptPrompt(false)

    expect(notifications.promptOpen).toBe(false)
    expect(timer.status).toBe('running')
  })

  it('asks about a kind that is still off even once the browser said yes', async () => {
    const { notifications, settings } = await boot()
    await settings.setNotification('timerEnd', true)

    expect(notifications.promptBeforeStart()).toBe(true)
    expect(notifications.asking).toBe('eyeBreak')
  })

  it('stays out of the way once every kind is on', async () => {
    const { notifications, settings, timer } = await boot()
    await settings.setNotification('timerEnd', true)
    await settings.setNotification('eyeBreak', true)

    expect(notifications.promptBeforeStart()).toBe(false)
    expect(timer.status).toBe('stopped')
  })

  it('stays out of the way while the browser blocks notifications', async () => {
    FakeNotification.permission = 'denied'

    const { notifications } = await boot()

    expect(notifications.promptBeforeStart()).toBe(false)
  })

  it('does not come back for a kind after its checkbox', async () => {
    FakeNotification.permission = 'default'

    const { notifications, settings, timer } = await boot()
    notifications.promptBeforeStart()
    await notifications.declinePrompt(true)
    await notifications.declinePrompt(false)

    expect(settings.promptsDismissed).toEqual({ timerEnd: true, eyeBreak: false })

    await timer.stop()
    expect(notifications.promptBeforeStart()).toBe(true)
    expect(notifications.asking).toBe('eyeBreak')
  })

  it('comes back after a plain no', async () => {
    FakeNotification.permission = 'default'

    const { notifications, settings, timer } = await boot()
    notifications.promptBeforeStart()
    await notifications.declinePrompt(false)
    await notifications.declinePrompt(false)

    expect(settings.promptsDismissed).toEqual({ timerEnd: false, eyeBreak: false })

    await timer.stop()
    expect(notifications.promptBeforeStart()).toBe(true)
    expect(notifications.asking).toBe('timerEnd')
  })

  it('never opens for a session that came back from storage', async () => {
    FakeNotification.permission = 'default'
    storedSession()

    const { notifications, timer } = await boot()

    expect(timer.status).toBe('running')
    expect(notifications.promptOpen).toBe(false)
  })

  it('turns the notification on when the browser grants it', async () => {
    FakeNotification.permission = 'default'

    const { notifications, settings } = await boot()
    notifications.promptBeforeStart()
    await notifications.acceptPrompt(false)

    expect(settings.notifications.timerEnd).toBe(true)
    expect(notifications.access).toBe('granted')
  })

  it('leaves the notification off when the browser refuses', async () => {
    FakeNotification.permission = 'default'
    FakeNotification.answer = 'denied'

    const { notifications, settings } = await boot()
    notifications.promptBeforeStart()
    await notifications.acceptPrompt(false)

    expect(settings.notifications.timerEnd).toBe(false)
    expect(notifications.blocked).toBe(true)
  })
})

describe('the settings screen', () => {
  it('asks for permission when a kind is turned on', async () => {
    FakeNotification.permission = 'default'

    const { notifications, settings } = await boot()
    const on = await notifications.setEnabled('timerEnd', true)

    expect(on).toBe(true)
    expect(settings.notifications.timerEnd).toBe(true)
  })

  it('refuses to turn a kind on while the browser blocks it', async () => {
    FakeNotification.permission = 'denied'

    const { notifications, settings } = await boot()
    const on = await notifications.setEnabled('timerEnd', true)

    expect(on).toBe(false)
    expect(settings.notifications.timerEnd).toBe(false)
  })
})
