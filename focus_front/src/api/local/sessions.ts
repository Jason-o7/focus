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
    const stored = read().map(toSessionDto)
    stored.push(toSessionDto(value))
    localStorage.setItem(KEY, JSON.stringify(stored))
  },
}
