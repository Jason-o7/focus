import { toBackgroundList } from '@/api/dto'
import type { BackgroundRepo } from '@/api/types'
import catalog from './data/backgrounds.json'

export const backgrounds: BackgroundRepo = {
  async list() {
    return toBackgroundList(catalog)
  },
}
