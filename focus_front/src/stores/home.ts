import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHomeStore = defineStore('home', () => {
  const settingsCardCollapsed = ref(false)

  function setSettingsCardCollapsed(value: boolean) {
    settingsCardCollapsed.value = value
  }

  return { settingsCardCollapsed, setSettingsCardCollapsed }
})
