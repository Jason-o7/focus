import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repo } from '@/api'
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

  async function persist() {
    if (!canEdit.value) return

    try {
      await repo().settings.save(snapshot())
      saveFailed.value = false
    } catch {
      saveFailed.value = true
    }
  }
  // #endregion

  // #region Actions
  async function selectSound(id: string) {
    if (!canEdit.value) return
    soundId.value = id
    await persist()
  }

  async function selectBackground(id: string) {
    if (!canEdit.value) return
    backgroundId.value = id
    await persist()
  }

  async function toggleEyeBreak() {
    if (!canEdit.value) return
    eyeBreakEnabled.value = !eyeBreakEnabled.value
    await persist()
  }

  async function setEyeBreakMinutes(minutes: number) {
    if (!canEdit.value) return
    if (!isValidEyeBreakMinutes(minutes)) return
    eyeBreakMinutes.value = minutes
    await persist()
  }

  async function addEyeBreakPreset(minutes: number) {
    if (!canEdit.value) return
    if (!isValidEyeBreakMinutes(minutes)) return
    if (eyeBreakPresets.value.includes(minutes)) return

    eyeBreakPresets.value = [...eyeBreakPresets.value, minutes].sort((a, b) => a - b)
    await persist()
  }

  async function removeEyeBreakPreset(minutes: number) {
    if (!canEdit.value) return
    if (eyeBreakPresets.value.length <= 1) return

    eyeBreakPresets.value = eyeBreakPresets.value.filter((value) => value !== minutes)

    const first = eyeBreakPresets.value[0]
    if (first !== undefined && !eyeBreakPresets.value.includes(eyeBreakMinutes.value)) {
      eyeBreakMinutes.value = first
    }

    await persist()
  }

  async function selectMode(value: TimerMode) {
    if (!canEdit.value) return
    mode.value = value
    await persist()
  }

  async function setFocusMs(value: number) {
    if (!canEdit.value) return
    if (!isValidFocusMs(value)) return
    focusMs.value = value
    await persist()
  }

  async function setDailyGoalMs(value: number) {
    if (!canEdit.value) return
    if (!isValidGoalMs(value)) return
    dailyGoalMs.value = value
    await persist()
  }

  async function setBreakMs(value: number) {
    if (!canEdit.value) return
    if (!isValidBreakMs(value)) return
    breakMs.value = value
    await persist()
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
  }
})
