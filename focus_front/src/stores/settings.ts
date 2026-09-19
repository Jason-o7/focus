import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repo } from '@/api'
import { DEFAULT_SETTINGS, type Settings } from '@/types/settings'
import { isValidEyeBreakMinutes } from '@/utils/eyeBreak'

export const useSettingsStore = defineStore('settings', () => {
  // #region State
  const soundId = ref(DEFAULT_SETTINGS.soundId)
  const backgroundId = ref(DEFAULT_SETTINGS.backgroundId)
  const eyeBreakEnabled = ref(DEFAULT_SETTINGS.eyeBreakEnabled)
  const eyeBreakMinutes = ref(DEFAULT_SETTINGS.eyeBreakMinutes)
  const eyeBreakPresets = ref<number[]>([...DEFAULT_SETTINGS.eyeBreakPresets])

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
  }

  function snapshot(): Settings {
    return {
      soundId: soundId.value,
      backgroundId: backgroundId.value,
      eyeBreakEnabled: eyeBreakEnabled.value,
      eyeBreakMinutes: eyeBreakMinutes.value,
      eyeBreakPresets: [...eyeBreakPresets.value],
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
  // #endregion

  return {
    soundId,
    backgroundId,
    eyeBreakEnabled,
    eyeBreakMinutes,
    eyeBreakPresets,
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
  }
})
