import { toSettings, toSettingsDto } from '@/api/dto'
import type { SettingsRepo } from '@/api/types'
import { DEFAULT_SETTINGS } from '@/types/settings'

const KEY = 'focus.settings'

export const settings: SettingsRepo = {
  async get() {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return { ...DEFAULT_SETTINGS }

    try {
      return toSettings(JSON.parse(raw))
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  },

  async save(value) {
    localStorage.setItem(KEY, JSON.stringify(toSettingsDto(value)))
  },
}
