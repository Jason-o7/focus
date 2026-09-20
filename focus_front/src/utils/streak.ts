import { daysBetween, shiftDay } from '@/utils/day'

export const DEBT_CAP_MS = 3 * 60 * 60 * 1000
export const DEBT_CLOCK_DAYS = 7
export const DEBT_WARN_DAYS = 4

export interface StreakInput {
  dailyTotals: ReadonlyMap<string, number>
  goalMs: number
  today: string
}

export interface StreakResult {
  days: number
  debtMs: number
  debtDeadline: string | null
}

const EMPTY: StreakResult = { days: 0, debtMs: 0, debtDeadline: null }

/**
 * The rules of docs/emociones.md 4.3: a debt bucket of 3 h with a 7 day clock.
 * Nothing is stored. The streak is replayed from the history every time.
 */
export function computeStreak({ dailyTotals, goalMs, today }: StreakInput): StreakResult {
  const studied = [...dailyTotals.entries()].filter(([, ms]) => ms > 0).map(([day]) => day)
  if (studied.length === 0) return EMPTY

  const firstDay = studied.reduce((earliest, day) => (day < earliest ? day : earliest))
  if (daysBetween(firstDay, today) < 0) return EMPTY

  let debtMs = 0
  let clockStartedOn: string | null = null
  let compliedDays = 0

  function breakStreak() {
    debtMs = 0
    clockStartedOn = null
    compliedDays = 0
  }

  for (let day = firstDay; daysBetween(day, today) > 0; day = shiftDay(day, 1)) {
    const studiedMs = dailyTotals.get(day) ?? 0

    if (goalMs === 0) {
      compliedDays += 1
      continue
    }

    if (studiedMs >= goalMs) {
      compliedDays += 1
      debtMs = Math.max(0, debtMs - (studiedMs - goalMs))
      if (debtMs === 0) clockStartedOn = null
    } else {
      if (debtMs === 0) clockStartedOn = day
      debtMs += goalMs - studiedMs

      if (debtMs > DEBT_CAP_MS) {
        breakStreak()
        continue
      }
    }

    if (clockStartedOn !== null && daysBetween(clockStartedOn, day) >= DEBT_CLOCK_DAYS) {
      breakStreak()
    }
  }

  const todayComplied = goalMs === 0 || (dailyTotals.get(today) ?? 0) >= goalMs

  return {
    days: compliedDays + (todayComplied ? 1 : 0),
    debtMs,
    debtDeadline: clockStartedOn === null ? null : shiftDay(clockStartedOn, DEBT_CLOCK_DAYS),
  }
}
