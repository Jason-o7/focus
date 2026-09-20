import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repo } from '@/api'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import type { ActiveSession, TimerMode, TimerPhase, TimerStatus } from '@/types/timer'
import { mergeByDay, splitByDay } from '@/utils/day'

const TICK_MS = 1000

// Under a second is a misclick, not a session.
const MIN_RECORDED_MS = 1000

export const useTimerStore = defineStore('timer', () => {
  const settings = useSettingsStore()
  const sessions = useSessionsStore()

  // #region Session state
  const id = ref('')
  const mode = ref<TimerMode>('timer')
  const phase = ref<TimerPhase>('focus')
  const startedAt = ref(0)
  const status = ref<TimerStatus>('stopped')
  const focusMs = ref(0)
  const breakMs = ref(0)
  const focusedMs = ref(0)
  const focusedByDay = ref<Record<string, number>>({})
  const phaseAccumulatedMs = ref(0)
  const segmentStartedAt = ref<number | null>(null)
  // #endregion

  // #region Repaint clock
  const now = ref(Date.now())
  let tickHandle: ReturnType<typeof setInterval> | null = null

  function syncNow() {
    now.value = Date.now()
  }

  function onVisibilityChange() {
    if (!document.hidden) syncNow()
  }

  function startTicking() {
    if (tickHandle !== null) return
    syncNow()
    tickHandle = setInterval(syncNow, TICK_MS)
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  function stopTicking() {
    if (tickHandle === null) return
    clearInterval(tickHandle)
    tickHandle = null
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
  // #endregion

  // #region Flags
  const loaded = ref(false)
  const loadFailed = ref(false)
  const saveFailed = ref(false)

  const canEdit = computed(() => loaded.value && settings.canEdit)
  // #endregion

  // #region Derived time
  function elapsedAt(at: number) {
    const openSegment = segmentStartedAt.value === null ? 0 : at - segmentStartedAt.value
    return Math.max(0, phaseAccumulatedMs.value + openSegment)
  }

  const elapsedMs = computed(() => elapsedAt(now.value))

  const targetMs = computed(() => {
    if (mode.value === 'stopwatch') return null
    return phase.value === 'focus' ? focusMs.value : breakMs.value
  })

  const remainingMs = computed(() =>
    targetMs.value === null ? null : targetMs.value - elapsedMs.value,
  )

  const isOvertime = computed(
    () => status.value !== 'stopped' && remainingMs.value !== null && remainingMs.value <= 0,
  )

  const canStartBreak = computed(
    () => status.value !== 'stopped' && mode.value === 'timer' && phase.value === 'focus',
  )

  const displayMs = computed(() => {
    if (status.value === 'stopped') {
      return settings.mode === 'stopwatch' ? 0 : settings.focusMs
    }

    if (remainingMs.value !== null && remainingMs.value > 0) {
      return Math.ceil(remainingMs.value / 1000) * 1000
    }

    return remainingMs.value === null ? elapsedMs.value : Math.abs(remainingMs.value)
  })
  // #endregion

  // #region Reading and writing the whole session
  function apply(session: ActiveSession) {
    id.value = session.id
    mode.value = session.mode
    phase.value = session.phase
    startedAt.value = session.startedAt
    status.value = session.status
    focusMs.value = session.focusMs
    breakMs.value = session.breakMs
    focusedMs.value = session.focusedMs
    focusedByDay.value = { ...session.focusedByDay }
    phaseAccumulatedMs.value = session.phaseAccumulatedMs
    segmentStartedAt.value = session.segmentStartedAt
  }

  function snapshot(): ActiveSession {
    return {
      id: id.value,
      mode: mode.value,
      phase: phase.value,
      startedAt: startedAt.value,
      status: status.value,
      focusMs: focusMs.value,
      breakMs: breakMs.value,
      focusedMs: focusedMs.value,
      focusedByDay: { ...focusedByDay.value },
      phaseAccumulatedMs: phaseAccumulatedMs.value,
      segmentStartedAt: segmentStartedAt.value,
    }
  }

  function reset() {
    id.value = ''
    phase.value = 'focus'
    startedAt.value = 0
    status.value = 'stopped'
    focusMs.value = 0
    breakMs.value = 0
    focusedMs.value = 0
    focusedByDay.value = {}
    phaseAccumulatedMs.value = 0
    segmentStartedAt.value = null
  }

  async function persist() {
    try {
      await repo().activeSession.save(snapshot())
      saveFailed.value = false
    } catch {
      saveFailed.value = true
    }
  }

  async function load() {
    if (loaded.value) return

    try {
      const session = await repo().activeSession.get()
      loaded.value = true
      loadFailed.value = false

      if (session === null || session.status === 'stopped' || sessions.has(session.id)) {
        reset()
        if (session !== null) await repo().activeSession.clear()
        return
      }

      apply(session)
      syncNow()
      if (status.value === 'running') startTicking()
    } catch {
      loadFailed.value = true
    }
  }
  // #endregion

  // #region Focus time, day by day
  function openFocusSegment(at: number) {
    if (phase.value !== 'focus' || segmentStartedAt.value === null) return {}
    return splitByDay(segmentStartedAt.value, at)
  }

  function closeFocusSegment(at: number) {
    focusedByDay.value = mergeByDay(focusedByDay.value, openFocusSegment(at))
  }
  // #endregion

  // #region Actions
  async function start() {
    if (!canEdit.value) return
    if (status.value !== 'stopped') return

    id.value = crypto.randomUUID()
    startedAt.value = Date.now()
    mode.value = settings.mode
    focusMs.value = settings.mode === 'stopwatch' ? 0 : settings.focusMs
    breakMs.value = settings.mode === 'stopwatch' ? 0 : settings.breakMs
    phase.value = 'focus'
    focusedMs.value = 0
    focusedByDay.value = {}
    phaseAccumulatedMs.value = 0
    segmentStartedAt.value = Date.now()
    status.value = 'running'

    startTicking()
    await persist()
  }

  async function pause() {
    if (status.value !== 'running') return

    const at = Date.now()
    closeFocusSegment(at)
    phaseAccumulatedMs.value = elapsedAt(at)
    segmentStartedAt.value = null
    status.value = 'paused'

    stopTicking()
    await persist()
  }

  async function resume() {
    if (status.value !== 'paused') return

    segmentStartedAt.value = Date.now()
    status.value = 'running'

    startTicking()
    await persist()
  }

  async function startBreak() {
    if (!canStartBreak.value) return

    if (settings.canEdit) breakMs.value = settings.breakMs

    const at = Date.now()
    closeFocusSegment(at)
    focusedMs.value = elapsedAt(at)
    phase.value = 'break'
    phaseAccumulatedMs.value = 0
    segmentStartedAt.value = at
    status.value = 'running'

    startTicking()
    await persist()
  }

  async function stop() {
    if (status.value === 'stopped') return

    const endedAt = Date.now()
    const totalMs = phase.value === 'focus' ? elapsedAt(endedAt) : focusedMs.value

    if (totalMs >= MIN_RECORDED_MS) {
      const stored = await sessions.add({
        id: id.value,
        mode: mode.value,
        startedAt: startedAt.value,
        endedAt,
        focusedMs: totalMs,
        focusedByDay: mergeByDay(focusedByDay.value, openFocusSegment(endedAt)),
      })

      if (!stored) {
        saveFailed.value = true
        return
      }
    }

    stopTicking()
    reset()

    try {
      await repo().activeSession.clear()
      saveFailed.value = false
    } catch {
      saveFailed.value = true
    }
  }
  // #endregion

  return {
    id,
    mode,
    phase,
    startedAt,
    status,
    focusMs,
    breakMs,
    focusedMs,
    elapsedMs,
    targetMs,
    remainingMs,
    isOvertime,
    canStartBreak,
    displayMs,
    loaded,
    loadFailed,
    saveFailed,
    canEdit,
    load,
    start,
    pause,
    resume,
    startBreak,
    stop,
  }
})
