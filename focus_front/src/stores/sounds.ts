import { defineStore } from 'pinia'
import { ref } from 'vue'
import { repo } from '@/api'
import type { Sound } from '@/types/sound'

export const useSoundsStore = defineStore('sounds', () => {
  const items = ref<Sound[]>([])
  const loaded = ref(false)

  async function load() {
    if (loaded.value) return
    items.value = await repo().sounds.list()
    loaded.value = true
  }

  return { items, loaded, load }
})
