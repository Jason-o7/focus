import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useTimerStore } from '@/stores/timer'
import {
  DEFAULT_NOTIFICATIONS,
  NOTIFICATION_CATALOG,
  type NotificationKind,
} from '@/types/notification'
import { playOvertime, scheduleOvertime, type CueHandle } from '@/utils/cues'
import {
  notify,
  permission,
  request,
  type NotifyOptions,
  type NotifyPermission,
} from '@/utils/notifications'

const TIMER_END_TAG = 'focus.timerEnd'

const FOCUS_END: NotifyOptions = {
  title: 'Bonus time!',
  body: 'You hit the target. Everything from here is extra.',
  tag: TIMER_END_TAG,
}

const BREAK_END: NotifyOptions = {
  title: "Break's over",
  body: 'The clock is waiting for you.',
  tag: TIMER_END_TAG,
}

export const useNotificationsStore = defineStore('notifications', () => {
  const settings = useSettingsStore()
  const timer = useTimerStore()

  // #region Permission
  const access = ref<NotifyPermission>(permission())

  const supported = computed(() => access.value !== 'unsupported')
  const blocked = computed(() => access.value === 'denied')

  function sync() {
    access.value = permission()
    return access.value
  }

  async function ask() {
    access.value = await request()
    return access.value
  }
  // #endregion

  // #region Sending
  function enabled(kind: NotificationKind) {
    return settings.notifications[kind] ?? DEFAULT_NOTIFICATIONS[kind]
  }

  function send(kind: NotificationKind, options: NotifyOptions) {
    if (!enabled(kind)) return false
    if (sync() !== 'granted') return false

    return notify(options)
  }

  async function setEnabled(kind: NotificationKind, value: boolean) {
    if (!value) {
      await settings.setNotification(kind, false)
      return false
    }

    if (sync() === 'default') await ask()
    if (access.value !== 'granted') return false

    await settings.setNotification(kind, true)
    return true
  }
  // #endregion

  // #region The prompt on starting a session
  const queue = ref<NotificationKind[]>([])

  /** The kind the overlay is asking about right now. One overlay per kind, in catalog order. */
  const asking = computed<NotificationKind | null>(() => queue.value[0] ?? null)

  const promptOpen = computed(() => asking.value !== null)

  // Blocked or unsupported is a closed door: there is nothing an overlay could offer
  function pending(): NotificationKind[] {
    if (!settings.loaded) return []
    if (!supported.value || blocked.value) return []

    return NOTIFICATION_CATALOG.map((kind) => kind.id).filter(
      (id) => !settings.notifications[id] && !settings.promptsDismissed[id],
    )
  }

  const canPrompt = computed(() => pending().length > 0)

  /** True when the prompt took the click over: answering it is what starts the session. */
  function promptBeforeStart() {
    const kinds = pending()
    if (kinds.length === 0) return false

    queue.value = kinds
    return true
  }

  async function answerPrompt(yes: boolean, dismiss: boolean) {
    const kind = asking.value
    if (kind === null) return

    const rest = queue.value.slice(1)
    queue.value = rest

    // * Nothing may be awaited before the request, or the click no longer counts as a gesture
    if (rest.length === 0) void timer.start()
    const answer = yes && access.value === 'default' ? ask() : Promise.resolve(access.value)

    if (yes && (await answer) === 'granted') await settings.setNotification(kind, true)
    if (dismiss) await settings.dismissPrompt(kind)

    // One refusal in the browser shuts every kind at once, so the rest of the queue is pointless
    if (queue.value.length > 0 && (!supported.value || blocked.value)) {
      queue.value = []
      void timer.start()
    }
  }

  function acceptPrompt(dismiss: boolean) {
    return answerPrompt(true, dismiss)
  }

  function declinePrompt(dismiss: boolean) {
    return answerPrompt(false, dismiss)
  }
  // #endregion

  // #region Crossings already spent
  let notifiedMark = ''
  let ready = false

  function mark() {
    return `${timer.id}:${timer.phase}`
  }

  watch(
    () => timer.loaded,
    (loaded) => {
      if (!loaded) return

      if (timer.isOvertime) notifiedMark = mark()
      ready = true
    },
    { immediate: true },
  )
  // #endregion

  // #region The cue at zero
  let booked: CueHandle | null = null

  function bookCue() {
    booked?.cancel()
    booked = null

    if (timer.status !== 'running') return

    const left = timer.remainingMs
    if (left === null || left <= 0) return

    booked = scheduleOvertime(left / 1000)
  }

  watch(() => [timer.status, timer.phase, timer.targetMs], bookCue, { immediate: true })
  // #endregion

  // #region The timer reaching zero
  watch(
    () => timer.isOvertime,
    (over) => {
      if (!over || !ready) return
      if (mark() === notifiedMark) return

      notifiedMark = mark()

      if (booked === null) playOvertime()
      booked = null

      send('timerEnd', timer.phase === 'focus' ? FOCUS_END : BREAK_END)
    },
  )
  // #endregion

  return {
    access,
    supported,
    blocked,
    promptOpen,
    asking,
    canPrompt,
    enabled,
    send,
    setEnabled,
    ask,
    promptBeforeStart,
    acceptPrompt,
    declinePrompt,
  }
})
