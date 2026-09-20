import { describe, expect, it } from 'vitest'
import { daysBetween, dayKey, mergeByDay, shiftDay, splitByDay } from '@/utils/day'
import { computeStreak } from '@/utils/streak'

const HOUR = 60 * 60 * 1000
const GOAL = 2 * HOUR

function totals(entries: Record<string, number>) {
  return new Map(Object.entries(entries))
}

describe('day keys', () => {
  it('counts whole days across a month', () => {
    expect(daysBetween('2026-09-28', '2026-10-02')).toBe(4)
    expect(shiftDay('2026-09-30', 1)).toBe('2026-10-01')
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('uses the local day, not UTC', () => {
    const late = new Date(2026, 8, 19, 23, 30).getTime()
    expect(dayKey(late)).toBe('2026-09-19')
  })
})

describe('splitByDay', () => {
  it('keeps a span inside one day whole', () => {
    const from = new Date(2026, 8, 19, 10, 0).getTime()
    const to = new Date(2026, 8, 19, 10, 45).getTime()

    expect(splitByDay(from, to)).toEqual({ '2026-09-19': 45 * 60_000 })
  })

  it('cuts a span at midnight', () => {
    const from = new Date(2026, 8, 19, 23, 40).getTime()
    const to = new Date(2026, 8, 20, 0, 20).getTime()

    expect(splitByDay(from, to)).toEqual({
      '2026-09-19': 20 * 60_000,
      '2026-09-20': 20 * 60_000,
    })
  })

  it('cuts a span that covers a whole day', () => {
    const from = new Date(2026, 8, 19, 22, 0).getTime()
    const to = new Date(2026, 8, 21, 1, 0).getTime()

    expect(splitByDay(from, to)).toEqual({
      '2026-09-19': 2 * 60 * 60_000,
      '2026-09-20': 24 * 60 * 60_000,
      '2026-09-21': 60 * 60_000,
    })
  })

  it('is empty when nothing ran', () => {
    const at = new Date(2026, 8, 19, 10, 0).getTime()

    expect(splitByDay(at, at)).toEqual({})
    expect(splitByDay(at, at - 1000)).toEqual({})
  })

  it('adds up the days when two spans are merged', () => {
    const base = { '2026-09-19': 1000, '2026-09-20': 500 }

    expect(mergeByDay(base, { '2026-09-20': 250, '2026-09-21': 100 })).toEqual({
      '2026-09-19': 1000,
      '2026-09-20': 750,
      '2026-09-21': 100,
    })
    expect(base).toEqual({ '2026-09-19': 1000, '2026-09-20': 500 })
  })
})

describe('computeStreak', () => {
  it('is empty with no history', () => {
    expect(computeStreak({ dailyTotals: totals({}), goalMs: GOAL, today: '2026-09-19' })).toEqual({
      days: 0,
      debtMs: 0,
      debtDeadline: null,
    })
  })

  it('counts only the days that met the goal', () => {
    const result = computeStreak({
      dailyTotals: totals({
        '2026-09-16': GOAL,
        '2026-09-17': GOAL,
        '2026-09-18': GOAL,
      }),
      goalMs: GOAL,
      today: '2026-09-19',
    })

    expect(result.days).toBe(3)
    expect(result.debtMs).toBe(0)
  })

  it('adds today the moment the goal is met', () => {
    const history = { '2026-09-17': GOAL, '2026-09-18': GOAL }

    expect(
      computeStreak({ dailyTotals: totals(history), goalMs: GOAL, today: '2026-09-19' }).days,
    ).toBe(2)

    expect(
      computeStreak({
        dailyTotals: totals({ ...history, '2026-09-19': GOAL }),
        goalMs: GOAL,
        today: '2026-09-19',
      }).days,
    ).toBe(3)
  })

  it('forgives a missed day without crediting it', () => {
    const result = computeStreak({
      dailyTotals: totals({ '2026-09-16': GOAL, '2026-09-17': 0, '2026-09-18': GOAL }),
      goalMs: GOAL,
      today: '2026-09-19',
    })

    expect(result.days).toBe(2)
    expect(result.debtMs).toBe(GOAL)
  })

  it('does not break on one missed day, it fills the bucket', () => {
    const result = computeStreak({
      dailyTotals: totals({
        '2026-09-16': GOAL,
        '2026-09-17': HOUR,
        '2026-09-18': GOAL,
      }),
      goalMs: GOAL,
      today: '2026-09-19',
    })

    expect(result.days).toBe(2)
    expect(result.debtMs).toBe(HOUR)
  })

  it('breaks the moment the bucket goes over 3 h', () => {
    const result = computeStreak({
      dailyTotals: totals({
        '2026-09-16': GOAL,
        '2026-09-17': 0,
        '2026-09-18': 0,
      }),
      goalMs: GOAL,
      today: '2026-09-19',
    })

    expect(result.days).toBe(0)
    expect(result.debtMs).toBe(0)
  })

  it('lets a surplus empty the bucket', () => {
    const result = computeStreak({
      dailyTotals: totals({
        '2026-09-16': HOUR,
        '2026-09-17': GOAL + HOUR,
        '2026-09-18': GOAL,
      }),
      goalMs: GOAL,
      today: '2026-09-19',
    })

    expect(result.days).toBe(2)
    expect(result.debtMs).toBe(0)
    expect(result.debtDeadline).toBeNull()
  })

  it('breaks when the bucket is still dirty after seven days', () => {
    const history: Record<string, number> = { '2026-09-01': HOUR }
    for (let day = 2; day <= 12; day++) {
      history[`2026-09-${String(day).padStart(2, '0')}`] = GOAL
    }

    const result = computeStreak({
      dailyTotals: totals(history),
      goalMs: GOAL,
      today: '2026-09-13',
    })

    expect(result.days).toBeLessThan(13)
    expect(result.debtMs).toBe(0)
  })

  it('shows the deadline while the bucket is dirty', () => {
    const result = computeStreak({
      dailyTotals: totals({ '2026-09-17': HOUR, '2026-09-18': GOAL }),
      goalMs: GOAL,
      today: '2026-09-19',
    })

    expect(result.debtMs).toBe(HOUR)
    expect(result.debtDeadline).toBe('2026-09-24')
  })

  it('never breaks when the goal is zero', () => {
    const result = computeStreak({
      dailyTotals: totals({ '2026-09-10': HOUR }),
      goalMs: 0,
      today: '2026-09-19',
    })

    expect(result.days).toBe(10)
  })

  it('lands near today after a long absence', () => {
    const result = computeStreak({
      dailyTotals: totals({ '2026-08-01': GOAL }),
      goalMs: GOAL,
      today: '2026-09-19',
    })

    expect(result.days).toBe(0)
  })
})
