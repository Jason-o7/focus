<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import { MINUTE_MS } from '@/utils/duration'
import { DEBT_CAP_MS, DEBT_WARN_DAYS } from '@/utils/streak'

const props = defineProps<{
  debtMs: number
  daysLeft: number | null
  landing: boolean
}>()

const jar = useTemplateRef<HTMLElement>('jar')

const fraction = computed(() => Math.min(1, Math.max(0, props.debtMs / DEBT_CAP_MS)))

const showClock = computed(() => props.daysLeft !== null && props.daysLeft <= DEBT_WARN_DAYS)

const closed = computed(() => {
  if (props.daysLeft === null) return 0
  return Math.min(1, Math.max(0, (DEBT_WARN_DAYS + 1 - props.daysLeft) / (DEBT_WARN_DAYS + 1)))
})

const amount = computed(() => {
  const minutes = Math.round(props.debtMs / MINUTE_MS)
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60

  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest} min`
})

const label = computed(() => {
  const head = `${amount.value} to catch up`
  if (!showClock.value || props.daysLeft === null) return head

  return props.daysLeft <= 1 ? `${head}, last day` : `${head}, ${props.daysLeft} days left`
})

defineExpose({ jar })
</script>

<template>
  <div class="flex flex-col items-center gap-2.5" role="img" :aria-label="label" :title="label">
    <!-- Mark -->
    <svg
      class="size-5 text-info/70"
      :class="landing ? 'mark-spin' : ''"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 2v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L3 8" />
    </svg>

    <div class="relative h-22 w-11">
      <!-- Seven day clock -->
      <svg v-if="showClock" class="absolute -inset-2" viewBox="0 0 60 104" fill="none">
        <rect
          x="1"
          y="1"
          width="58"
          height="102"
          rx="17"
          stroke="currentColor"
          stroke-width="2"
          class="text-border"
        />
        <rect
          :stroke-dashoffset="100 - closed * 100"
          x="1"
          y="1"
          width="58"
          height="102"
          rx="17"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          pathLength="100"
          stroke-dasharray="100"
          class="text-info drop-shadow-[0_0_4px_var(--color-info)] transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
        />
      </svg>

      <!-- Jar -->
      <div
        ref="jar"
        class="jar absolute inset-0 overflow-hidden rounded-t-[8px] rounded-b-[16px] border-2 border-info/40 bg-surface"
        :class="landing ? 'jar-landing' : ''"
      >
        <!-- Jar - Liquid -->
        <div
          class="liquid absolute inset-x-0 bottom-0 bg-info transition-[height] duration-500 ease-out motion-reduce:transition-none"
          :style="{ height: `${fraction * 100}%` }"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-white/30 via-white/5 to-transparent" />
          <div class="absolute inset-x-0 top-0 h-[3px] bg-white/75" />
        </div>

        <!-- Jar - Glass -->
        <div
          class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/14 via-transparent to-transparent"
        />
      </div>
    </div>

    <!-- Amount -->
    <div
      class="flex flex-col items-center gap-0.5 text-tiny whitespace-nowrap text-text-muted"
      :class="landing ? 'amount-drop' : ''"
    >
      <b class="font-clock text-body font-semibold text-info">{{ amount }}</b>
      <span>to catch up</span>
    </div>
  </div>
</template>

<style scoped>
.jar {
  box-shadow: 0 0 20px -3px color-mix(in srgb, var(--color-info) 65%, transparent);
}

.liquid {
  box-shadow: 0 -9px 18px -2px color-mix(in srgb, var(--color-info) 60%, transparent);
  animation: liquid-breathe 3200ms ease-in-out infinite;
}

.jar-landing {
  animation: jar-hit 420ms ease-out;
}

.amount-drop {
  animation: amount-drop 480ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.mark-spin {
  animation: mark-spin 620ms cubic-bezier(0.34, 1.2, 0.64, 1);
}

@keyframes mark-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(-360deg);
  }
}

@keyframes amount-drop {
  0% {
    transform: translateY(-5px) scale(1.18);
    text-shadow: 0 0 14px color-mix(in srgb, var(--color-info) 85%, transparent);
  }

  100% {
    transform: none;
    text-shadow: none;
  }
}

@keyframes liquid-breathe {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-1.5px);
  }
}

@keyframes jar-hit {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-info) 70%, transparent);
  }

  35% {
    transform: scale(1.14);
    box-shadow: 0 0 0 10px color-mix(in srgb, var(--color-info) 0%, transparent);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-info) 0%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .jar-landing,
  .amount-drop,
  .mark-spin,
  .liquid {
    animation: none;
  }
}
</style>
