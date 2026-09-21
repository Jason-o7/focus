import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repo } from '@/api'
import { useSettingsStore } from '@/stores/settings'
import type { ExtraDay, Session } from '@/types/session'
import { daysBetween, shiftDay, startOfNextDay, todayKey } from '@/utils/day'
import { MINUTE_MS } from '@/utils/duration'
import { computeStreak } from '@/utils/streak'

const TOWER_DAYS = 4

/** The special reward of emociones.md 4.2: the goal, the settled debt, and 30 min on top. */
const SPECIAL_EXTRA_MS = 30 * MINUTE_MS

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

  const todaySurplusMs = computed(() =>
    goalMs.value > 0 ? Math.max(0, todayMs.value - goalMs.value) : 0,
  )

  /** How far past the goal each day went. A day that did not pass it is not in here. */
  const surplusByDay = computed(() => {
    const totals = new Map<string, number>()
    if (goalMs.value <= 0) return totals

    for (const [day, ms] of dailyTotals.value) {
      if (ms > goalMs.value) totals.set(day, ms - goalMs.value)
    }

    return totals
  })

  /**
   * The rows of the tower: the last four calendar days, plus the most recent day
   * before those that had extra time. Decided by Jason on 2026-09-20.
   */
  const extraDays = computed<ExtraDay[]>(() => {
    const rows: ExtraDay[] = []

    for (let back = 0; back < TOWER_DAYS; back++) {
      const day = shiftDay(today.value, -back)
      rows.push({ day, extraMs: surplusByDay.value.get(day) ?? 0 })
    }

    const oldest = rows[rows.length - 1]?.day ?? today.value
    let earlier: string | null = null

    for (const day of surplusByDay.value.keys()) {
      if (day >= oldest) continue
      if (earlier === null || day > earlier) earlier = day
    }

    if (earlier !== null) rows.push({ day: earlier, extraMs: surplusByDay.value.get(earlier) ?? 0 })

    return rows
  })

  const specialTargetMs = computed(() =>
    goalMs.value > 0 ? goalMs.value + streak.value.debtMs + SPECIAL_EXTRA_MS : 0,
  )

  const specialReached = computed(
    () => specialTargetMs.value > 0 && todayMs.value >= specialTargetMs.value,
  )

  const debtMs = computed(() => Math.max(0, streak.value.debtMs - todaySurplusMs.value))

  const debtDaysLeft = computed(() => {
    if (debtMs.value <= 0) return null

    const deadline = streak.value.debtDeadline
    if (deadline === null) return null

    return Math.max(0, daysBetween(today.value, deadline))
  })
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
    todaySurplusMs,
    surplusByDay,
    extraDays,
    specialTargetMs,
    specialReached,
    debtMs,
    debtDaysLeft,
    load,
    add,
    has,
  }
})
