import { toSessionDto, toSessionList } from '@/api/dto'
import type { SessionRepo } from '@/api/types'

const KEY = 'focus.sessions'

function read() {
  const raw = localStorage.getItem(KEY)
  if (raw === null) return []

  try {
    return toSessionList(JSON.parse(raw))
  } catch {
    return []
  }
}

export const sessions: SessionRepo = {
  async list() {
    return read()
  },

  async add(value) {
    const raw = localStorage.getItem(KEY)
    let stored: unknown[] = []

    // Rewriting a history that could not be read here would throw it away
    if (raw !== null) {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) throw new Error('The session history is not a list')
      stored = parsed
    }

    stored.push(toSessionDto(value))
    localStorage.setItem(KEY, JSON.stringify(stored))
  },
}
