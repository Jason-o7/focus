<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import type { ExtraDay } from '@/types/session'
import { formatSpan } from '@/utils/duration'

const props = defineProps<{
  days: ExtraDay[]
  landing: boolean
}>()

const MIN_BLOCK = 10
const MAX_BLOCK = 44
const FLAT_BLOCK = 3
const CURVE = 0.7

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const tower = useTemplateRef<HTMLElement>('tower')

const tallest = computed(() => Math.max(1, ...props.days.map((row) => row.extraMs)))

const total = computed(() => props.days.reduce((sum, row) => sum + row.extraMs, 0))

function dateOf(day: string) {
  const [year, month, date] = day.split('-').map(Number)
  return new Date(year ?? 0, (month ?? 1) - 1, date ?? 1)
}

function height(ms: number) {
  if (ms <= 0) return FLAT_BLOCK

  const share = Math.pow(ms / tallest.value, CURVE)
  return Math.round(MIN_BLOCK + share * (MAX_BLOCK - MIN_BLOCK))
}

/** Today and yesterday by name, the other recent days by weekday, the old one by date. */
function label(day: string, index: number) {
  if (index === 0) return 'today'
  if (index === 1) return 'yest'

  const date = dateOf(day)
  if (index < props.days.length - 1 || props.days.length <= 4) return WEEKDAYS[date.getDay()]

  return `${MONTHS[date.getMonth()]} ${date.getDate()}`
}

defineExpose({ tower })
</script>

<template>
  <div class="flex flex-col items-end gap-2.5">
    <!-- Days -->
    <div ref="tower" class="flex flex-col gap-2">
      <div v-for="(row, index) in days" :key="row.day" class="flex items-center justify-end gap-2.5">
        <span class="w-11 text-right text-tiny text-text-muted">{{ label(row.day, index) }}</span>

        <div
          class="block-bar w-7 rounded-[5px] transition-[height] duration-500 ease-out motion-reduce:transition-none"
          :class="[
            row.extraMs > 0 ? 'bg-accent' : 'bg-surface-elevated',
            row.extraMs > 0 && index === 0 && landing ? 'block-landing' : '',
          ]"
          :style="{ height: `${height(row.extraMs)}px` }"
        />

        <span class="w-14 text-tiny whitespace-nowrap text-text-muted">
          <b v-if="row.extraMs > 0" class="font-clock font-semibold text-accent">{{
            formatSpan(row.extraMs)
          }}</b>
          <template v-else>—</template>
        </span>
      </div>
    </div>

    <!-- All of them -->
    <!-- TODO: open the full list of days with extra time. Nothing behind it yet. -->
    <button
      type="button"
      disabled
      class="flex h-7 cursor-not-allowed items-center gap-1.5 rounded-full border border-border px-3 text-tiny text-text-muted opacity-60"
      title="Not built yet"
    >
      <svg
        class="size-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <path d="M5 12h.01M12 12h.01M19 12h.01" />
      </svg>
      All days
    </button>

    <span class="sr-only">{{ formatSpan(total) }} past the goal in these days</span>
  </div>
</template>

<style scoped>
.block-bar {
  box-shadow: 0 0 10px -3px color-mix(in srgb, var(--color-accent) 80%, transparent);
}

.block-landing {
  animation: block-hit 460ms ease-out;
}

@keyframes block-hit {
  0% {
    transform: scaleX(1);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 65%, transparent);
  }

  35% {
    transform: scaleX(1.22);
    box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-accent) 0%, transparent);
  }

  100% {
    transform: scaleX(1);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .block-landing {
    animation: none;
  }
}
</style>
