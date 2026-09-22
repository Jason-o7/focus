/** Every kind of notification the app can send. */

export interface NotificationKindInfo {
  id: string
  label: string
  description: string
}

export const NOTIFICATION_CATALOG = [
  {
    id: 'timerEnd',
    label: 'Timer reaches zero',
    description: 'Tells you the session is over, even while this tab sits in the background.',
  },
] as const satisfies readonly NotificationKindInfo[]

export type NotificationKind = (typeof NOTIFICATION_CATALOG)[number]['id']

export const DEFAULT_NOTIFICATIONS: Record<NotificationKind, boolean> = {
  timerEnd: false,
}

export function isNotificationKind(raw: unknown): raw is NotificationKind {
  return NOTIFICATION_CATALOG.some((kind) => kind.id === raw)
}
