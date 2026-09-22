/** The only door to the browser's Notification API. */

export type NotifyPermission = 'unsupported' | 'default' | 'granted' | 'denied'

export interface NotifyOptions {
  title: string
  body?: string
  /** Same tag replaces the previous notification instead of stacking on it. */
  tag?: string
}

let broken = false

function api(): typeof Notification | null {
  if (broken) return null
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  return window.Notification
}

export function permission(): NotifyPermission {
  const bell = api()
  if (bell === null) return 'unsupported'

  try {
    return bell.permission
  } catch {
    broken = true
    return 'unsupported'
  }
}

/** Has to run inside a click: browsers refuse the dialog without a user gesture. */
export async function request(): Promise<NotifyPermission> {
  const bell = api()
  if (bell === null) return 'unsupported'

  try {
    await bell.requestPermission()
  } catch {
    broken = true
    return 'unsupported'
  }

  return permission()
}

export function notify(options: NotifyOptions): boolean {
  const bell = api()
  if (bell === null) return false
  if (permission() !== 'granted') return false

  try {
    const shown = new bell(options.title, { body: options.body, tag: options.tag })

    shown.onclick = () => {
      window.focus()
      shown.close()
    }

    return true
  } catch {
    broken = true
    return false
  }
}
