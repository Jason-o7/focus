import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repo } from '@/api'
import type { Background } from '@/types/background'

export const useBackgroundsStore = defineStore('backgrounds', () => {
  const items = ref<Background[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    items.value = await repo().backgrounds.list()
    loaded.value = true
  }

  return { items, loaded, load }
})
