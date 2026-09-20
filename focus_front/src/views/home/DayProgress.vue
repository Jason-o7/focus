<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { formatMinutes } from '@/utils/duration'

const props = defineProps<{
  streakDays: number
  valueMs: number
  goalMs: number
  landing: boolean
  carriedMs: number
  carriedToYesterday: boolean
}>()

const bar = useTemplateRef<HTMLElement>('bar')
const note = useTemplateRef<HTMLElement>('note')

const fraction = computed(() => {
  if (props.goalMs <= 0) return 1
  return Math.min(1, props.valueMs / props.goalMs)
})

const reached = computed(() => fraction.value >= 1)

const countedMs = computed(() => (reached.value ? props.goalMs : props.valueMs))
const extraMs = computed(() => Math.max(0, props.valueMs - props.goalMs))

defineExpose({ bar, note })
</script>

<template>
  <div class="flex flex-col items-center gap-2.5">
    <!-- Streak -->
    <div v-if="streakDays > 0" class="flex items-center gap-1.5 text-body text-text-secondary">
      <svg class="size-4 text-accent" viewBox="0 0 24 24" fill="currentColor">
        <path
          d="M13.5 2c.3 3-1.2 4.4-2.6 5.7C9.3 9.2 8 10.5 8 13a4 4 0 0 0 8 0c0-1-.3-1.8-.7-2.5 1.7.8 2.7 2.5 2.7 4.5a6 6 0 0 1-12 0c0-3.2 1.8-5 3.4-6.6C11.1 6.7 12.6 5.2 13.5 2Z"
        />
      </svg>
      <span
        ><b class="font-semibold text-text-primary">{{ streakDays }}</b> day{{
          streakDays === 1 ? '' : 's'
        }}</span
      >
    </div>

    <!-- Goal -->
    <div class="flex flex-col items-center gap-1.5">
      <div
        ref="bar"
        class="day-bar h-2.5 w-64 overflow-hidden rounded-full bg-surface-elevated shadow-[inset_0_0_0_1px_var(--color-border)]"
        :class="landing ? 'day-bar-landing' : ''"
        role="progressbar"
        :aria-valuemin="0"
        :aria-valuemax="goalMs"
        :aria-valuenow="valueMs"
        aria-label="Today's goal"
      >
        <div
          class="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          :class="reached ? 'bg-success' : 'bg-accent'"
          :style="{ width: `${fraction * 100}%` }"
        />
      </div>
      <div class="flex flex-col items-center gap-0.5">
        <p v-if="goalMs <= 0" class="text-tiny text-text-muted">Rest day, nothing to reach</p>

        <p v-else-if="valueMs <= 0" class="text-tiny text-text-muted">
          <b class="font-semibold text-text-secondary">{{ formatMinutes(goalMs) }}</b> to go today
        </p>

        <p v-else class="text-tiny text-text-muted">
          <b class="font-semibold" :class="reached ? 'text-success' : 'text-text-secondary'">{{
            formatMinutes(countedMs)
          }}</b>
          of {{ formatMinutes(goalMs)
          }}<span v-if="reached" class="font-semibold text-success"> done!</span>
        </p>

        <Transition
          enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
          enter-from-class="translate-y-[-4px] opacity-0"
        >
          <p v-if="extraMs > 0" class="text-tiny text-text-muted">
            plus <b class="font-semibold text-accent">{{ formatMinutes(extraMs) }}</b> on top
          </p>
        </Transition>

        <!-- Goal - Time that belongs to an earlier day -->
        <Transition
          enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
          leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
          enter-from-class="translate-y-[-4px] opacity-0"
          leave-to-class="opacity-0"
        >
          <p v-if="carriedMs > 0" class="text-tiny text-text-muted">
            <b class="font-semibold text-info">{{ formatMinutes(carriedMs) }}</b> of that session
            counted for {{ carriedToYesterday ? 'yesterday' : 'earlier days' }}
          </p>
        </Transition>

        <span ref="note" class="block size-0" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-bar-landing {
  animation: day-bar-hit 420ms ease-out;
}

@keyframes day-bar-hit {
  0% {
    transform: scaleY(1);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 60%, transparent);
  }
  35% {
    transform: scaleY(2.1);
    box-shadow: 0 0 0 7px color-mix(in srgb, var(--color-accent) 0%, transparent);
  }
  100% {
    transform: scaleY(1);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .day-bar-landing {
    animation: none;
  }
}
</style>
