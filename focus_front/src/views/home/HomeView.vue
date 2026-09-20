<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import PetCompanion from '@/components/PetCompanion.vue'
import { useBackgroundsStore } from '@/stores/backgrounds'
import { useHomeStore } from '@/stores/home'
import { useSessionsStore } from '@/stores/sessions'
import { useSettingsStore } from '@/stores/settings'
import { useSoundsStore } from '@/stores/sounds'
import { useTimerStore } from '@/stores/timer'
import type { PetState } from '@/types/pet'
import type { Session } from '@/types/session'
import type { TimerStatus } from '@/types/timer'
import { shiftDay } from '@/utils/day'
import DayProgress from '@/views/home/DayProgress.vue'
import SettingsCard from '@/views/home/SettingsCard.vue'
import TimerPanel from '@/views/home/TimerPanel.vue'

const settings = useSettingsStore()
const sounds = useSoundsStore()
const backgrounds = useBackgroundsStore()
const sessions = useSessionsStore()
const timer = useTimerStore()
const home = useHomeStore()

onMounted(async () => {
  await Promise.allSettled([settings.load(), sounds.load(), backgrounds.load()])
  await sessions.load()
  await timer.load()
  settledMs.value = sessions.todayMs
})

// #region Pet
const PET_BY_STATUS: Record<TimerStatus, PetState> = {
  stopped: 'idle',
  running: 'focusing',
  paused: 'waiting',
}

const petState = computed(() => PET_BY_STATUS[timer.status])
// #endregion

// #region Options card
watch(
  () => timer.status,
  (status) => home.setSettingsCardCollapsed(status !== 'stopped'),
)
// #endregion

// #region The finished session flying into the bar
const FLIGHT_MS = 820
const LANDING_MS = 450
const MIN_PIECE = 20
const MAX_PIECE = 48
const CARRY_NOTE_MS = 8000

const dayProgress = useTemplateRef<InstanceType<typeof DayProgress>>('dayProgress')
const timerPanel = useTemplateRef<InstanceType<typeof TimerPanel>>('timerPanel')
const piece = useTemplateRef<HTMLElement>('piece')

const settledMs = ref(0)
const flying = ref(false)
const landing = ref(false)
const pieceSize = ref(MIN_PIECE)
const carriedMs = ref(0)
const carriedToYesterday = ref(true)
let landingTimer: ReturnType<typeof setTimeout> | undefined
let carryTimer: ReturnType<typeof setTimeout> | undefined
let pendingCarry = { ms: 0, toYesterday: true }

const showDay = computed(() => timer.status === 'stopped' && sessions.loaded)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function land() {
  settledMs.value = sessions.todayMs
  landing.value = true
  clearTimeout(landingTimer)
  landingTimer = setTimeout(() => (landing.value = false), LANDING_MS)

  carriedMs.value = pendingCarry.ms
  carriedToYesterday.value = pendingCarry.toYesterday
  clearTimeout(carryTimer)
  if (pendingCarry.ms > 0) {
    carryTimer = setTimeout(() => (carriedMs.value = 0), CARRY_NOTE_MS)
  }
}

function measureCarry(session: Session) {
  const earlier = Object.keys(session.focusedByDay).filter((day) => day !== sessions.today)

  pendingCarry = {
    ms: earlier.reduce((sum, day) => sum + (session.focusedByDay[day] ?? 0), 0),
    toYesterday: earlier.length === 1 && earlier[0] === shiftDay(sessions.today, -1),
  }
}

async function fly(todayMs: number) {
  if (todayMs <= 0) {
    land()
    return
  }

  const share = sessions.goalMs > 0 ? Math.min(1, todayMs / sessions.goalMs) : 1
  pieceSize.value = Math.round(MIN_PIECE + share * (MAX_PIECE - MIN_PIECE))

  flying.value = true
  await nextTick()

  const from = timerPanel.value?.clock?.getBoundingClientRect()
  const to = dayProgress.value?.bar?.getBoundingClientRect()
  const el = piece.value

  if (from === undefined || to === undefined || el == null || prefersReducedMotion()) {
    flying.value = false
    land()
    return
  }

  const size = pieceSize.value
  const startX = from.left + from.width / 2 - size / 2
  const startY = from.top + from.height / 2 - size / 2
  const endX = to.left + to.width / 2 - size / 2
  const endY = to.top + to.height / 2 - size / 2
  const peakX = (startX + endX) / 2
  const peakY = Math.min(startY, endY) - 90

  await el.animate(
    [
      { transform: `translate(${startX}px, ${startY}px) scale(0.3)`, opacity: 0 },
      { transform: `translate(${startX}px, ${startY}px) scale(1)`, opacity: 1, offset: 0.14 },
      { transform: `translate(${peakX}px, ${peakY}px) scale(1.12)`, opacity: 1, offset: 0.58 },
      { transform: `translate(${endX}px, ${endY}px) scale(0.24)`, opacity: 0.9 },
    ],
    { duration: FLIGHT_MS, easing: 'cubic-bezier(0.32, 0, 0.35, 1)' },
  ).finished

  flying.value = false
  land()
}

watch(
  () => sessions.lastFinished,
  (session) => {
    if (session === null) return
    measureCarry(session)
    void fly(session.focusedByDay[sessions.today] ?? 0)
  },
)

onUnmounted(() => {
  clearTimeout(landingTimer)
  clearTimeout(carryTimer)
})
// #endregion
</script>

<template>
  <section class="relative h-full">
    <!-- Streak and goal -->
    <Transition
      enter-active-class="transition-opacity duration-300 motion-reduce:transition-none"
      leave-active-class="transition-opacity duration-150 motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <DayProgress
        v-if="showDay"
        ref="dayProgress"
        class="absolute top-7 left-1/2 -translate-x-1/2"
        :streak-days="sessions.streak.days"
        :value-ms="settledMs"
        :goal-ms="sessions.goalMs"
        :landing="landing"
        :carried-ms="carriedMs"
        :carried-to-yesterday="carriedToYesterday"
      />
    </Transition>

    <!-- Session timer -->
    <TimerPanel ref="timerPanel" />

    <!-- Session settings -->
    <SettingsCard />

    <!-- Pet -->
    <PetCompanion :state="petState" :size="150" mirror class="absolute right-5 bottom-5" />

    <!-- The session flying into the bar -->
    <span
      v-if="flying"
      ref="piece"
      class="pointer-events-none fixed top-0 left-0 z-40 rounded-full bg-accent shadow-[0_0_24px_-2px_var(--color-accent)]"
      :style="{ width: `${pieceSize}px`, height: `${pieceSize}px` }"
    />
  </section>
</template>
