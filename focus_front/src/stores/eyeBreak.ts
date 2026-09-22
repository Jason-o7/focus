import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useSettingsStore } from '@/stores/settings'
import { useTimerStore } from '@/stores/timer'
import { playEyeBreak, scheduleEyeBreak, type CueHandle } from '@/utils/cues'
import { MINUTE_MS } from '@/utils/duration'
import type { NotifyOptions } from '@/utils/notifications'

const NUDGE: NotifyOptions = {
  title: 'Your eyes earned a 20-second break',
  body: 'Look at anything 6 m away. The clock keeps running, so you lose nothing.',
  tag: 'focus.eyeBreak',
}

export const useEyeBreakStore = defineStore('eyeBreak', () => {
  const settings = useSettingsStore()
  const timer = useTimerStore()
  const notifications = useNotificationsStore()

  // #region When it counts
  const intervalMs = computed(() => settings.eyeBreakMinutes * MINUTE_MS)

  const counting = computed(
    () =>
      notifications.enabled('eyeBreak') && timer.status === 'running' && timer.phase === 'focus',
  )

  /** Whole intervals of focus piled up in this session. Pausing and resting freeze it. */
  const crossings = computed(() => Math.floor(timer.focusedSoFarMs / intervalMs.value))
  // #endregion

  // #region Marks already spent
  let seen = 0

  // A session that comes back from storage past several marks owes nothing: they already happened
  watch(
    () => [timer.loaded, timer.id, timer.phase, intervalMs.value],
    () => (seen = crossings.value),
    { immediate: true },
  )
  // #endregion

  // #region The nudge
  let booked: CueHandle | null = null

  watch(crossings, (count) => {
    if (!counting.value) return
    if (count <= seen) return

    seen = count

    if (booked === null) playEyeBreak()
    booked = null

    notifications.send('eyeBreak', NUDGE)
  })
  // #endregion

  // #region The cue, booked ahead
  function bookCue() {
    booked?.cancel()
    booked = null

    if (!counting.value) return

    const left = intervalMs.value - (timer.focusedSoFarMs % intervalMs.value)
    booked = scheduleEyeBreak(left / 1000)
  }

  watch(() => [counting.value, intervalMs.value, crossings.value], bookCue, { immediate: true })
  // #endregion

  return { intervalMs, counting, crossings }
})
