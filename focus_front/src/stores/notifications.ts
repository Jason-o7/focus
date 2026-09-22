import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useTimerStore } from '@/stores/timer'
import { DEFAULT_NOTIFICATIONS, type NotificationKind } from '@/types/notification'
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
  const promptOpen = ref(false)

  const canPrompt = computed(
    () => settings.loaded && !settings.notificationPromptDismissed && access.value === 'default',
  )

  /** True when the prompt took the click over: answering it is what starts the session. */
  function promptBeforeStart() {
    if (!canPrompt.value) return false

    promptOpen.value = true
    return true
  }

  async function acceptPrompt(dismiss: boolean) {
    promptOpen.value = false
    void timer.start()

    // * Nothing may be awaited before this line, or the click no longer counts as a gesture
    const answer = await ask()

    if (answer === 'granted') await settings.setNotification('timerEnd', true)
    if (dismiss) await settings.dismissNotificationPrompt()
  }

  async function declinePrompt(dismiss: boolean) {
    promptOpen.value = false

    await timer.start()
    if (dismiss) await settings.dismissNotificationPrompt()
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
