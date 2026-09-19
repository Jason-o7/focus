import type { Background } from '@/types/background'
import type { Settings } from '@/types/settings'
import type { Sound } from '@/types/sound'

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

// TODO: SessionRepo and AuthRepo (docs/frontend-arquitectura.md 6.4).
