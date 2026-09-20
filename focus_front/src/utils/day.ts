const DAY_MS = 86_400_000

/** The local calendar day a moment belongs to, as YYYY-MM-DD. */
export function dayKey(at: number): string {
  const date = new Date(at)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function todayKey(now: number = Date.now()): string {
  return dayKey(now)
}

function parts(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return { year: year ?? 0, month: month ?? 1, day: day ?? 1 }
}

export function shiftDay(key: string, days: number): string {
  const { year, month, day } = parts(key)
  return dayKey(new Date(year, month - 1, day + days).getTime())
}

/** The first moment of the local day after the one this moment belongs to. */
export function startOfNextDay(at: number): number {
  const date = new Date(at)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime()
}

/** How much of the span fell on each local day, cut at every midnight it crossed. */
export function splitByDay(from: number, to: number): Record<string, number> {
  const totals: Record<string, number> = {}

  for (let cursor = from; cursor < to; ) {
    const edge = Math.min(startOfNextDay(cursor), to)
    if (edge <= cursor) break

    const key = dayKey(cursor)
    totals[key] = (totals[key] ?? 0) + (edge - cursor)
    cursor = edge
  }

  return totals
}

export function mergeByDay(
  base: Readonly<Record<string, number>>,
  extra: Readonly<Record<string, number>>,
): Record<string, number> {
  const totals: Record<string, number> = { ...base }

  for (const [day, ms] of Object.entries(extra)) {
    totals[day] = (totals[day] ?? 0) + ms
  }

  return totals
}

/** Whole days from one key to the other. Uses UTC so a DST change cannot add or drop one. */
export function daysBetween(from: string, to: string): number {
  const a = parts(from)
  const b = parts(to)
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / DAY_MS,
  )
}
