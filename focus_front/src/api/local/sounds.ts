import { toSoundList } from '@/api/dto'
import type { SoundRepo } from '@/api/types'
import catalog from './data/sounds.json'

export const sounds: SoundRepo = {
  async list() {
    return toSoundList(catalog)
  },
}
