import { toActiveSession, toActiveSessionDto } from '@/api/dto'
import type { ActiveSessionRepo } from '@/api/types'

const KEY = 'focus.activeSession'

export const activeSession: ActiveSessionRepo = {
  async get() {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return null

    try {
      return toActiveSession(JSON.parse(raw))
    } catch {
      return null
    }
  },

  async save(value) {
    localStorage.setItem(KEY, JSON.stringify(toActiveSessionDto(value)))
  },

  async clear() {
    localStorage.removeItem(KEY)
  },
}
