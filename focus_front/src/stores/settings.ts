import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repo } from '@/api'
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings'

export const EYE_BREAK_PRESETS = [10, 15, 20]

export const useSettingsStore = defineStore('settings', () => {
  // #region State
  const soundId = ref(DEFAULT_SETTINGS.soundId)
  const backgroundId = ref(DEFAULT_SETTINGS.backgroundId)
  const eyeBreakEnabled = ref(DEFAULT_SETTINGS.eyeBreakEnabled)
  const eyeBreakMinutes = ref(DEFAULT_SETTINGS.eyeBreakMinutes)

  const loaded = ref(false)
  const saveFailed = ref(false)
  // #endregion

  // #region Reading and writing the whole object
  function apply(value: Settings) {
    soundId.value = value.soundId
    backgroundId.value = value.backgroundId
    eyeBreakEnabled.value = value.eyeBreakEnabled
    eyeBreakMinutes.value = value.eyeBreakMinutes
  }

  function snapshot(): Settings {
    return {
      soundId: soundId.value,
      backgroundId: backgroundId.value,
      eyeBreakEnabled: eyeBreakEnabled.value,
      eyeBreakMinutes: eyeBreakMinutes.value,
    }
  }

  async function load() {
    if (loaded.value) return
    apply(await repo().settings.get())
    loaded.value = true
  }

  async function persist() {
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
    soundId.value = id
    await persist()
  }

  async function selectBackground(id: string) {
    backgroundId.value = id
    await persist()
  }

  async function toggleEyeBreak() {
    eyeBreakEnabled.value = !eyeBreakEnabled.value
    await persist()
  }

  async function setEyeBreakMinutes(minutes: number) {
    if (!Number.isInteger(minutes) || minutes < 1) return
    eyeBreakMinutes.value = minutes
    await persist()
  }
  // #endregion

  return {
    soundId,
    backgroundId,
    eyeBreakEnabled,
    eyeBreakMinutes,
    loaded,
    saveFailed,
    load,
    selectSound,
    selectBackground,
    toggleEyeBreak,
    setEyeBreakMinutes,
  }
})
