import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repo } from '@/api'
import { useSettingsStore } from '@/stores/settings'
import type { Session } from '@/types/session'
import { startOfNextDay, todayKey } from '@/utils/day'
import { computeStreak } from '@/utils/streak'

export const useSessionsStore = defineStore('sessions', () => {
  const settings = useSettingsStore()

  // #region State
  const items = ref<Session[]>([])
  const today = ref(todayKey())
  const lastFinished = ref<Session | null>(null)

  const loaded = ref(false)
  const loadFailed = ref(false)
  const saveFailed = ref(false)

  const canEdit = computed(() => loaded.value)
  // #endregion

  // #region Derived
  const dailyTotals = computed(() => {
    const totals = new Map<string, number>()
    for (const session of items.value) {
      for (const [day, ms] of Object.entries(session.focusedByDay)) {
        totals.set(day, (totals.get(day) ?? 0) + ms)
      }
    }
    return totals
  })

  const todayMs = computed(() => dailyTotals.value.get(today.value) ?? 0)

  const goalMs = computed(() => settings.dailyGoalMs)
  const goalReached = computed(() => goalMs.value > 0 && todayMs.value >= goalMs.value)

  const streak = computed(() =>
    computeStreak({ dailyTotals: dailyTotals.value, goalMs: goalMs.value, today: today.value }),
  )
  // #endregion

  // #region Midnight
  let rollover: ReturnType<typeof setTimeout> | undefined

  function scheduleRollover() {
    clearTimeout(rollover)
    const at = Date.now()
    rollover = setTimeout(() => {
      today.value = todayKey()
      scheduleRollover()
    }, startOfNextDay(at) - at + 1000)
  }
  // #endregion

  // #region Reading and writing
  async function load() {
    if (loaded.value) return

    try {
      items.value = await repo().sessions.list()
      today.value = todayKey()
      loaded.value = true
      loadFailed.value = false
      scheduleRollover()
    } catch {
      loadFailed.value = true
    }
  }

  async function add(session: Session): Promise<boolean> {
    if (!canEdit.value) return false

    try {
      await repo().sessions.add(session)
      saveFailed.value = false
    } catch {
      saveFailed.value = true
      return false
    }

    today.value = todayKey()
    items.value = [...items.value, session]
    lastFinished.value = session
    return true
  }

  function has(id: string) {
    return items.value.some((session) => session.id === id)
  }
  // #endregion

  return {
    items,
    today,
    lastFinished,
    loaded,
    loadFailed,
    saveFailed,
    canEdit,
    dailyTotals,
    todayMs,
    goalMs,
    goalReached,
    streak,
    load,
    add,
    has,
  }
})
