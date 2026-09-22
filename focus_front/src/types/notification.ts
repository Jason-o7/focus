/** Every kind of notification the app can send. */

export interface NotificationPromptCopy {
  title: string
  body: string
  accept: string
}

export interface NotificationKindInfo {
  id: string
  label: string
  description: string
  /** What the overlay says when this kind is the one being asked about. */
  prompt: NotificationPromptCopy
}

export const NOTIFICATION_CATALOG = [
  {
    id: 'timerEnd',
    label: 'Timer reaches zero',
    description: 'Tells you the session is over, even while this tab sits in the background.',
    prompt: {
      title: 'Want a nudge at zero?',
      body: "Even with this tab buried, you'll know when time is up.",
      accept: 'Nudge me',
    },
  },
  {
    id: 'eyeBreak',
    label: 'Time to rest your eyes',
    description: 'Every so often during a session, a nudge to look far away for 20 seconds.',
    prompt: {
      title: 'Want to save your eyes?',
      body: 'Every so often we will tell you to look 6 m away for 20 seconds. The clock keeps running.',
      accept: 'Remind me',
    },
  },
] as const satisfies readonly NotificationKindInfo[]

export type NotificationKind = (typeof NOTIFICATION_CATALOG)[number]['id']

export const DEFAULT_NOTIFICATIONS: Record<NotificationKind, boolean> = {
  timerEnd: false,
  eyeBreak: false,
}

export const DEFAULT_PROMPTS_DISMISSED: Record<NotificationKind, boolean> = {
  timerEnd: false,
  eyeBreak: false,
}

export function isNotificationKind(raw: unknown): raw is NotificationKind {
  return NOTIFICATION_CATALOG.some((kind) => kind.id === raw)
}

export function notificationKind(id: NotificationKind): NotificationKindInfo {
  return NOTIFICATION_CATALOG.find((kind) => kind.id === id) ?? NOTIFICATION_CATALOG[0]
}
