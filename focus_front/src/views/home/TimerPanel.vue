<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import FlipClock from '@/components/FlipClock.vue'
import { useSettingsStore } from '@/stores/settings'
import { useTimerStore } from '@/stores/timer'
import type { TimerPhase } from '@/types/timer'
import { formatDuration, formatMinutes } from '@/utils/duration'
import DurationOverlay from '@/views/home/DurationOverlay.vue'

const settings = useSettingsStore()
const timer = useTimerStore()

// #region Clock
const isIdle = computed(() => timer.status === 'stopped')
const isPaused = computed(() => timer.status === 'paused')
const showDurations = computed(() => isIdle.value && settings.mode === 'timer')

const clockText = computed(() => formatDuration(timer.displayMs))

const clockColor = computed(() => {
  if (isPaused.value) return 'text-text-secondary'
  return timer.isOvertime ? 'text-accent' : 'text-text-primary'
})
// #endregion

// #region Phase line
const phaseLine = computed(() => {
  if (isIdle.value) return null

  const focus = timer.phase === 'focus'

  if (isPaused.value) {
    return { lead: '', word: focus ? 'Focus' : 'Break', tail: ' paused' }
  }

  return { lead: 'Time to ', word: focus ? 'focus' : 'rest', tail: '' }
})
// #endregion

// #region Durations
const overlayTarget = ref<TimerPhase | null>(null)
// #endregion

// #region Reaching the target
const CELEBRATION_MS = 500

const FRESH_CROSSING_MS = 2000

const celebrating = ref(false)
let celebrationTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => timer.isOvertime,
  (over) => {
    if (!over) return
    if (Math.abs(timer.remainingMs ?? 0) > FRESH_CROSSING_MS) return

    clearTimeout(celebrationTimer)
    celebrating.value = true
    celebrationTimer = setTimeout(() => (celebrating.value = false), CELEBRATION_MS)
  },
)

onUnmounted(() => clearTimeout(celebrationTimer))
// #endregion

const MODE_BUTTON =
  'flex-1 cursor-pointer rounded-[7px] text-body transition-colors duration-150 motion-reduce:transition-none'
const ACTION_BUTTON =
  'h-13 flex-1 cursor-pointer rounded-xl border text-body font-medium transition-colors duration-150 motion-reduce:transition-none'
const DURATION_BUTTON =
  'flex h-11 cursor-pointer items-center gap-2.5 rounded-full border border-border px-4 text-text-secondary transition-colors duration-150 hover:border-text-muted hover:text-text-primary motion-reduce:transition-none'
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0 grid grid-rows-[1fr_auto_1fr] justify-items-center *:pointer-events-auto">
    <!-- Above the clock -->
    <div class="flex flex-col items-center gap-7 self-end pb-4.25">
      <!-- Above the clock - Load error -->
      <p v-if="timer.loadFailed" class="text-tiny text-danger" role="alert">
        The session could not be loaded. Please refresh the page to try again.
      </p>

      <!-- Above the clock - Phase -->
      <p v-if="phaseLine !== null" class="text-[2.25rem] leading-none text-text-muted"
        :class="isPaused ? 'motion-safe:animate-pulse' : ''">
        {{ phaseLine.lead
        }}<b class="text-[1.25em] font-semibold" :class="isPaused ? 'text-info' : 'text-text-primary'">{{
          phaseLine.word }}</b>{{ phaseLine.tail }}
      </p>

      <!-- Above the clock - Break offer -->
      <div v-if="timer.canStartBreak && timer.isOvertime"
        class="break-offer flex h-11 items-center overflow-hidden rounded-full bg-accent">
        <button type="button"
          class="h-full cursor-pointer pr-4 pl-5 text-body font-medium text-background transition-colors duration-150 hover:bg-black/10 motion-reduce:transition-none"
          @click="timer.startBreak()">
          Take a break
        </button>
        <span class="h-5 w-px bg-black/20" />
        <button type="button"
          class="flex h-full cursor-pointer items-center gap-1.5 pr-4 pl-4 text-background transition-colors duration-150 hover:bg-black/10 motion-reduce:transition-none"
          aria-label="Change how long the break is" @click="overlayTarget = 'break'">
          <span class="font-clock text-body">{{ formatMinutes(settings.breakMs) }}</span>
          <svg class="size-3.5 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>

      <!-- Above the clock - Mode -->
      <div v-if="isIdle" class="box-border flex h-10 w-65 rounded-[10px] border border-border bg-surface p-1">
        <button type="button" :class="[
          MODE_BUTTON,
          settings.mode === 'timer'
            ? 'bg-surface-elevated text-text-primary'
            : 'text-text-muted hover:text-text-secondary',
        ]" :aria-pressed="settings.mode === 'timer'" @click="settings.selectMode('timer')">
          Timer
        </button>
        <button type="button" :class="[
          MODE_BUTTON,
          settings.mode === 'stopwatch'
            ? 'bg-surface-elevated text-text-primary'
            : 'text-text-muted hover:text-text-secondary',
        ]" :aria-pressed="settings.mode === 'stopwatch'" @click="settings.selectMode('stopwatch')">
          Stopwatch
        </button>
      </div>
    </div>

    <!-- Clock -->
    <div
      class="relative font-clock text-clock leading-[1.15] tracking-[0.04em] transition-colors duration-200 motion-reduce:transition-none"
      :class="[clockColor, celebrating ? 'clock-pop' : '']">
      <!-- Clock - Overtime sign -->
      <span v-if="timer.isOvertime"
        class="pointer-events-none absolute top-1/2 right-full mr-[0.12em] -translate-y-[0.54em] text-[0.42em] leading-none text-accent opacity-80">
        +
      </span>

      <!-- Clock - Reaching the target -->
      <span v-if="celebrating"
        class="clock-burst pointer-events-none absolute -inset-y-3 -inset-x-6 rounded-full border-2 border-accent" />

      <FlipClock :value="clockText" />
    </div>

    <!-- Below the clock -->
    <div class="flex flex-col items-center gap-7 self-start pt-4.25">
      <!-- Below the clock - Durations -->
      <div v-if="showDurations" class="flex gap-3">
        <button type="button" :class="DURATION_BUTTON" :disabled="!settings.canEdit" @click="overlayTarget = 'focus'">
          <span class="text-tiny tracking-[0.08em] text-text-muted uppercase">Focus</span>
          <span class="font-clock text-body text-text-primary">{{
            formatMinutes(settings.focusMs)
            }}</span>
        </button>
        <button type="button" :class="DURATION_BUTTON" :disabled="!settings.canEdit" @click="overlayTarget = 'break'">
          <span class="text-tiny tracking-[0.08em] text-text-muted uppercase">Break</span>
          <span class="font-clock text-body text-text-primary">{{
            formatMinutes(settings.breakMs)
            }}</span>
        </button>
      </div>

      <!-- Below the clock - Actions -->
      <div class="flex h-13 w-50 gap-2">
        <button v-if="isIdle" type="button" :class="[
          ACTION_BUTTON,
          'border-transparent bg-accent text-background hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40',
        ]" :disabled="!timer.canEdit" @click="timer.start()">
          Start focusing
        </button>

        <template v-else>
          <button type="button" :class="[
            ACTION_BUTTON,
            'border-transparent bg-accent text-background hover:bg-accent-hover',
          ]" @click="timer.status === 'running' ? timer.pause() : timer.resume()">
            {{ timer.status === 'running' ? 'Pause' : 'Resume' }}
          </button>
          <button type="button" :class="[
            ACTION_BUTTON,
            'border-border bg-transparent text-text-secondary hover:border-text-muted hover:text-text-primary',
          ]" @click="timer.stop()">
            I'm done
          </button>
        </template>
      </div>

    </div>
  </div>

  <!-- Duration overlay -->
  <DurationOverlay v-if="overlayTarget !== null" :target="overlayTarget" @update:target="overlayTarget = $event"
    @close="overlayTarget = null" />
</template>

<style scoped>
.clock-pop {
  animation: clock-pop 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.clock-burst {
  animation: clock-burst 500ms ease-out forwards;
}

.break-offer {
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 55%, transparent);
  animation: break-breath 2400ms ease-in-out infinite;
}

@keyframes clock-pop {
  0% {
    transform: scale(1);
  }

  45% {
    transform: scale(1.07);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes clock-burst {
  from {
    transform: scale(0.92);
    opacity: 0.85;
  }

  to {
    transform: scale(1.3);
    opacity: 0;
  }
}

@keyframes break-breath {

  0%,
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 55%, transparent);
  }

  50% {
    box-shadow: 0 0 0 10px color-mix(in srgb, var(--color-accent) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {

  .clock-pop,
  .clock-burst,
  .break-offer {
    animation: none;
  }

  .clock-burst {
    display: none;
  }
}
</style>
