import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repo } from '@/api'
import type { NotificationKind } from '@/types/notification'
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings'
import { isValidEyeBreakMinutes } from '@/utils/eyeBreak'
import { isValidBreakMs, isValidFocusMs, isValidGoalMs } from '@/utils/duration'
import type { TimerMode } from '@/types/timer'

export const useSettingsStore = defineStore('settings', () => {
  // #region State
  const soundId = ref(DEFAULT_SETTINGS.soundId)
  const backgroundId = ref(DEFAULT_SETTINGS.backgroundId)
  const eyeBreakEnabled = ref(DEFAULT_SETTINGS.eyeBreakEnabled)
  const eyeBreakMinutes = ref(DEFAULT_SETTINGS.eyeBreakMinutes)
  const eyeBreakPresets = ref<number[]>([...DEFAULT_SETTINGS.eyeBreakPresets])
  const mode = ref<TimerMode>(DEFAULT_SETTINGS.mode)
  const focusMs = ref(DEFAULT_SETTINGS.focusMs)
  const breakMs = ref(DEFAULT_SETTINGS.breakMs)
  const dailyGoalMs = ref(DEFAULT_SETTINGS.dailyGoalMs)
  const notifications = ref<Record<NotificationKind, boolean>>({ ...DEFAULT_SETTINGS.notifications })
  const notificationPromptDismissed = ref(DEFAULT_SETTINGS.notificationPromptDismissed)

  const loaded = ref(false)
  const loadFailed = ref(false)
  const saveFailed = ref(false)

  // Writing without a successful read would save the defaults over the stored settings.
  const canEdit = computed(() => loaded.value)
  // #endregion

  // #region Reading and writing the whole object
  function apply(value: Settings) {
    soundId.value = value.soundId
    backgroundId.value = value.backgroundId
    eyeBreakEnabled.value = value.eyeBreakEnabled
    eyeBreakMinutes.value = value.eyeBreakMinutes
    eyeBreakPresets.value = [...value.eyeBreakPresets]
    mode.value = value.mode
    focusMs.value = value.focusMs
    breakMs.value = value.breakMs
    dailyGoalMs.value = value.dailyGoalMs
    notifications.value = { ...value.notifications }
    notificationPromptDismissed.value = value.notificationPromptDismissed
  }

  function snapshot(): Settings {
    return {
      soundId: soundId.value,
      backgroundId: backgroundId.value,
      eyeBreakEnabled: eyeBreakEnabled.value,
      eyeBreakMinutes: eyeBreakMinutes.value,
      eyeBreakPresets: [...eyeBreakPresets.value],
      mode: mode.value,
      focusMs: focusMs.value,
      breakMs: breakMs.value,
      dailyGoalMs: dailyGoalMs.value,
      notifications: { ...notifications.value },
      notificationPromptDismissed: notificationPromptDismissed.value,
    }
  }

  async function load() {
    if (loaded.value) return

    try {
      apply(await repo().settings.get())
      loaded.value = true
      loadFailed.value = false
    } catch {
      loadFailed.value = true
    }
  }

  /** Changes and writes, or puts back what was there. The screen never claims a write that failed. */
  async function change(mutate: () => void) {
    if (!canEdit.value) return

    const previous = snapshot()
    mutate()

    try {
      await repo().settings.save(snapshot())
      saveFailed.value = false
    } catch {
      apply(previous)
      saveFailed.value = true
    }
  }
  // #endregion

  // #region Actions
  async function selectSound(id: string) {
    await change(() => (soundId.value = id))
  }

  async function selectBackground(id: string) {
    await change(() => (backgroundId.value = id))
  }

  async function toggleEyeBreak() {
    await change(() => (eyeBreakEnabled.value = !eyeBreakEnabled.value))
  }

  async function setEyeBreakMinutes(minutes: number) {
    if (!isValidEyeBreakMinutes(minutes)) return
    await change(() => (eyeBreakMinutes.value = minutes))
  }

  async function addEyeBreakPreset(minutes: number) {
    if (!isValidEyeBreakMinutes(minutes)) return
    if (eyeBreakPresets.value.includes(minutes)) return

    await change(() => {
      eyeBreakPresets.value = [...eyeBreakPresets.value, minutes].sort((a, b) => a - b)
    })
  }

  async function removeEyeBreakPreset(minutes: number) {
    if (eyeBreakPresets.value.length <= 1) return
    if (!eyeBreakPresets.value.includes(minutes)) return

    await change(() => {
      eyeBreakPresets.value = eyeBreakPresets.value.filter((value) => value !== minutes)

      const first = eyeBreakPresets.value[0]
      if (first !== undefined && !eyeBreakPresets.value.includes(eyeBreakMinutes.value)) {
        eyeBreakMinutes.value = first
      }
    })
  }

  async function selectMode(value: TimerMode) {
    await change(() => (mode.value = value))
  }

  async function setFocusMs(value: number) {
    if (!isValidFocusMs(value)) return
    await change(() => (focusMs.value = value))
  }

  async function setDailyGoalMs(value: number) {
    if (!isValidGoalMs(value)) return
    await change(() => (dailyGoalMs.value = value))
  }

  async function setBreakMs(value: number) {
    if (!isValidBreakMs(value)) return
    await change(() => (breakMs.value = value))
  }

  async function setNotification(kind: NotificationKind, enabled: boolean) {
    await change(() => (notifications.value = { ...notifications.value, [kind]: enabled }))
  }

  async function dismissNotificationPrompt() {
    await change(() => (notificationPromptDismissed.value = true))
  }
  // #endregion

  return {
    soundId,
    backgroundId,
    eyeBreakEnabled,
    eyeBreakMinutes,
    eyeBreakPresets,
    mode,
    focusMs,
    breakMs,
    dailyGoalMs,
    notifications,
    notificationPromptDismissed,
    loaded,
    loadFailed,
    saveFailed,
    canEdit,
    load,
    selectSound,
    selectBackground,
    toggleEyeBreak,
    setEyeBreakMinutes,
    addEyeBreakPreset,
    removeEyeBreakPreset,
    selectMode,
    setFocusMs,
    setBreakMs,
    setDailyGoalMs,
    setNotification,
    dismissNotificationPrompt,
  }
})
