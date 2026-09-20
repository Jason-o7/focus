import type { Background } from '@/types/background'
import type { Settings } from '@/types/settings'
import type { Sound } from '@/types/sound'
import type { Session } from '@/types/session'
import type { ActiveSession } from '@/types/timer'

export interface SettingsRepo {
  get(): Promise<Settings>
  save(value: Settings): Promise<void>
}

export interface SoundRepo {
  list(): Promise<Sound[]>
}

export interface BackgroundRepo {
  list(): Promise<Background[]>
}

export interface ActiveSessionRepo {
  get(): Promise<ActiveSession | null>
  save(value: ActiveSession): Promise<void>
  clear(): Promise<void>
}

export interface SessionRepo {
  list(): Promise<Session[]>
  add(value: Session): Promise<void>
}

// TODO: AuthRepo (docs/frontend-arquitectura.md 6.4).
