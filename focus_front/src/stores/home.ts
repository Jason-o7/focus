import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHomeStore = defineStore('home', () => {
  // TODO: collapse it on its own once the timer store says the session is running.
  const settingsCardCollapsed = ref(false)

  function setSettingsCardCollapsed(value: boolean) {
    settingsCardCollapsed.value = value
  }

  return { settingsCardCollapsed, setSettingsCardCollapsed }
})
