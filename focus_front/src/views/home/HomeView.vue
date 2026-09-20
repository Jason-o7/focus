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
import DebtJar from '@/views/home/DebtJar.vue'
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
  settle()
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

// #region The finished session flying to where it counts
const FLIGHT_MS = 820
const LANDING_MS = 450
const STAGGER_MS = 90
const MIN_PIECE = 20
const MAX_PIECE = 48
const CARRY_NOTE_MS = 8000

type ShardTarget = 'note' | 'bar' | 'jar'

interface Shard {
  target: ShardTarget
  size: number
  delay: number
}

const dayProgress = useTemplateRef<InstanceType<typeof DayProgress>>('dayProgress')
const debtJar = useTemplateRef<InstanceType<typeof DebtJar>>('debtJar')
const timerPanel = useTemplateRef<InstanceType<typeof TimerPanel>>('timerPanel')
const shardEls = useTemplateRef<HTMLElement[]>('shard')

const settledMs = ref(0)
const settledDebtMs = ref(0)
const shards = ref<Shard[]>([])
const barLanding = ref(false)
const jarLanding = ref(false)
const carriedMs = ref(0)
const carriedToYesterday = ref(true)

let barTimer: ReturnType<typeof setTimeout> | undefined
let jarTimer: ReturnType<typeof setTimeout> | undefined
let carryTimer: ReturnType<typeof setTimeout> | undefined
let pendingCarry = { ms: 0, toYesterday: true }

const showDay = computed(() => timer.status === 'stopped' && sessions.loaded)
const showJar = computed(() => showDay.value && settledDebtMs.value > 0)

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function settle() {
  settledMs.value = sessions.todayMs
  settledDebtMs.value = sessions.debtMs
}

function pulse(target: ShardTarget) {
  if (target === 'bar') {
    settledMs.value = sessions.todayMs
    barLanding.value = true
    clearTimeout(barTimer)
    barTimer = setTimeout(() => (barLanding.value = false), LANDING_MS)
    return
  }

  if (target === 'jar') {
    settledDebtMs.value = sessions.debtMs
    jarLanding.value = true
    clearTimeout(jarTimer)
    jarTimer = setTimeout(() => (jarLanding.value = false), LANDING_MS)
    return
  }

  carriedMs.value = pendingCarry.ms
  carriedToYesterday.value = pendingCarry.toYesterday
  clearTimeout(carryTimer)
  carryTimer = setTimeout(() => (carriedMs.value = 0), CARRY_NOTE_MS)
}

function measureCarry(session: Session) {
  const earlier = Object.keys(session.focusedByDay).filter((day) => day !== sessions.today)

  pendingCarry = {
    ms: earlier.reduce((sum, day) => sum + (session.focusedByDay[day] ?? 0), 0),
    toYesterday: earlier.length === 1 && earlier[0] === shiftDay(sessions.today, -1),
  }
}

function shardSize(ms: number) {
  const share = sessions.goalMs > 0 ? Math.min(1, ms / sessions.goalMs) : 1
  return Math.round(MIN_PIECE + share * (MAX_PIECE - MIN_PIECE))
}

function planFlight(session: Session): Shard[] {
  const capped = (ms: number) => (sessions.goalMs > 0 ? Math.min(ms, sessions.goalMs) : 0)

  const shares: [ShardTarget, number][] = [
    ['note', pendingCarry.ms],
    ['bar', Math.max(0, capped(sessions.todayMs) - capped(settledMs.value))],
    ['jar', Math.max(0, settledDebtMs.value - sessions.debtMs)],
  ]

  const planned = shares.filter(([, ms]) => ms > 0)
  if (planned.length === 0) planned.push(['bar', session.focusedByDay[sessions.today] ?? 0])

  return planned.map(([target, ms], index) => ({
    target,
    size: shardSize(ms),
    delay: index * STAGGER_MS,
  }))
}

function targetRect(target: ShardTarget) {
  if (target === 'bar') return dayProgress.value?.bar?.getBoundingClientRect()
  if (target === 'jar') return debtJar.value?.jar?.getBoundingClientRect()
  return dayProgress.value?.note?.getBoundingClientRect()
}

async function glide(shard: Shard, el: HTMLElement | undefined, from: DOMRect) {
  const to = targetRect(shard.target)

  if (el == null || to === undefined) {
    pulse(shard.target)
    return
  }

  const size = shard.size
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
    {
      duration: FLIGHT_MS,
      delay: shard.delay,
      fill: 'backwards',
      easing: 'cubic-bezier(0.32, 0, 0.35, 1)',
    },
  ).finished

  pulse(shard.target)
}

async function fly(session: Session) {
  measureCarry(session)
  if (pendingCarry.ms === 0) carriedMs.value = 0

  const plan = planFlight(session)
  shards.value = plan
  await nextTick()

  const from = timerPanel.value?.clock?.getBoundingClientRect()

  if (from === undefined || prefersReducedMotion()) {
    shards.value = []
    for (const shard of plan) pulse(shard.target)
    settle()
    return
  }

  const els = shardEls.value ?? []
  await Promise.all(plan.map((shard, index) => glide(shard, els[index], from)))

  shards.value = []
  settle()
}

watch(
  () => sessions.lastFinished,
  (session) => {
    if (session !== null) void fly(session)
  },
)

onUnmounted(() => {
  clearTimeout(barTimer)
  clearTimeout(jarTimer)
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
        :landing="barLanding"
        :carried-ms="carriedMs"
        :carried-to-yesterday="carriedToYesterday"
      />
    </Transition>

    <!-- Debt jar -->
    <Transition
      enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
      leave-active-class="transition duration-500 ease-in motion-reduce:transition-none"
      enter-from-class="opacity-0"
      leave-to-class="-translate-y-3 scale-90 opacity-0"
    >
      <DebtJar
        v-if="showJar"
        ref="debtJar"
        class="absolute top-5 right-5"
        :debt-ms="settledDebtMs"
        :days-left="sessions.debtDaysLeft"
        :landing="jarLanding"
      />
    </Transition>

    <!-- Session timer -->
    <TimerPanel ref="timerPanel" />

    <!-- Session settings -->
    <SettingsCard />

    <!-- Pet -->
    <PetCompanion :state="petState" :size="150" mirror class="absolute right-5 bottom-5" />

    <!-- The session flying to where it counts -->
    <span
      v-for="(shard, index) in shards"
      :key="index"
      ref="shard"
      class="pointer-events-none fixed top-0 left-0 z-40 rounded-full opacity-0"
      :class="
        shard.target === 'jar'
          ? 'bg-info shadow-[0_0_24px_-2px_var(--color-info)]'
          : 'bg-accent shadow-[0_0_24px_-2px_var(--color-accent)]'
      "
      :style="{ width: `${shard.size}px`, height: `${shard.size}px` }"
    />
  </section>
</template>
