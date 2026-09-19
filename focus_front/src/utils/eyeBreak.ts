export const EYE_BREAK_MIN_MINUTES = 1
export const EYE_BREAK_MAX_MINUTES = 60

export function isValidEyeBreakMinutes(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= EYE_BREAK_MIN_MINUTES &&
    value <= EYE_BREAK_MAX_MINUTES
  )
}
