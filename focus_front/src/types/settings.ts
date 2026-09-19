/** User preferences for a session. */
export interface Settings {
  soundId: string
  backgroundId: string
  eyeBreakEnabled: boolean
  eyeBreakMinutes: number
  eyeBreakPresets: number[]
}

export const DEFAULT_SETTINGS: Settings = {
  soundId: 'rain',
  backgroundId: 'dusk',
  eyeBreakEnabled: true,
  eyeBreakMinutes: 20,
  eyeBreakPresets: [10, 15, 20],
}
