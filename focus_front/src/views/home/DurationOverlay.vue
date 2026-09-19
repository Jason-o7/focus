<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import DurationDial from '@/components/DurationDial.vue'
import { useSettingsStore } from '@/stores/settings'
import type { TimerPhase } from '@/types/timer'
import {
  BREAK_MAX_MS,
  BREAK_MIN_MS,
  DEBUG_MS,
  FOCUS_MAX_MS,
  FOCUS_MIN_MS,
  MINUTE_MS,
  formatMinutes,
} from '@/utils/duration'

const props = defineProps<{ target: TimerPhase }>()

const emit = defineEmits<{
  'update:target': [target: TimerPhase]
  close: []
}>()

const settings = useSettingsStore()

const RANGES = {
  focus: { min: FOCUS_MIN_MS / MINUTE_MS, max: FOCUS_MAX_MS / MINUTE_MS, presets: [15, 25, 30, 45, 60] },
  break: { min: BREAK_MIN_MS / MINUTE_MS, max: BREAK_MAX_MS / MINUTE_MS, presets: [5, 10, 15, 30] },
} as const

const range = computed(() => RANGES[props.target])

const currentMs = computed(() =>
  props.target === 'focus' ? settings.focusMs : settings.breakMs,
)

function setMs(ms: number) {
  if (props.target === 'focus') settings.setFocusMs(ms)
  else settings.setBreakMs(ms)
}

const minutes = computed({
  get: () => Math.round(currentMs.value / MINUTE_MS),
  set: (value: number) => setMs(value * MINUTE_MS),
})

// TODO: remove with DEBUG_MS.
const showDebugPreset = import.meta.env.DEV
const debugSelected = computed(() => currentMs.value === DEBUG_MS)

// #region Closing
const sheet = ref<HTMLElement | null>(null)
const dial = ref<InstanceType<typeof DurationDial> | null>(null)

function onBackdropPointerDown(event: PointerEvent) {
  if (!sheet.value?.contains(event.target as Node)) emit('close')
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

watch(
  () => props.target,
  async () => {
    await nextTick()
    dial.value?.$el?.focus()
  },
  { immediate: true },
)
// #endregion

const TARGET_BUTTON =
  'flex h-13 flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg transition-colors duration-150 motion-reduce:transition-none'
const PRESET =
  'cursor-pointer rounded-full border px-3 py-2.5 text-tiny leading-none transition-colors duration-150 motion-reduce:transition-none'
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(7,10,18,0.72)]"
      @pointerdown="onBackdropPointerDown">
      <section ref="sheet"
        class="relative box-border w-130 rounded-[18px] border border-border bg-surface-elevated px-8 pt-7 pb-6"
        role="dialog" aria-modal="true" aria-label="Session length">
        <!-- Close -->
        <button type="button"
          class="absolute top-5 right-5 flex size-8 cursor-pointer items-center justify-center rounded-lg border border-transparent text-text-muted transition-colors duration-150 hover:border-border hover:text-text-primary motion-reduce:transition-none"
          aria-label="Close" @click="emit('close')">
          <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <h2 class="mb-5 text-subtitle font-medium">How long this time?</h2>

        <!-- Target -->
        <div class="mb-5 flex gap-1 rounded-[10px] border border-border bg-surface p-1">
          <button type="button" :class="[TARGET_BUTTON, target === 'focus' ? 'bg-surface-elevated' : '']"
            :aria-pressed="target === 'focus'" @click="emit('update:target', 'focus')">
            <span class="text-[11px] tracking-[0.08em] uppercase"
              :class="target === 'focus' ? 'text-text-primary' : 'text-text-muted'">Focus</span>
            <span class="font-clock text-body"
              :class="target === 'focus' ? 'text-text-primary' : 'text-text-secondary'">{{
                formatMinutes(settings.focusMs) }}</span>
          </button>
          <button type="button" :class="[TARGET_BUTTON, target === 'break' ? 'bg-surface-elevated' : '']"
            :aria-pressed="target === 'break'" @click="emit('update:target', 'break')">
            <span class="text-[11px] tracking-[0.08em] uppercase"
              :class="target === 'break' ? 'text-text-primary' : 'text-text-muted'">Break</span>
            <span class="font-clock text-body"
              :class="target === 'break' ? 'text-text-primary' : 'text-text-secondary'">{{
                formatMinutes(settings.breakMs) }}</span>
          </button>
        </div>

        <!-- Presets -->
        <div class="mb-6 flex gap-2">
          <button v-for="preset in range.presets" :key="preset" type="button" :class="[
            PRESET,
            preset === minutes
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-border bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary',
          ]" :aria-pressed="preset === minutes && !debugSelected" @click="minutes = preset">
            {{ preset }} min
          </button>

          <!-- TODO: remove with DEBUG_MS. -->
          <button v-if="showDebugPreset" type="button" :class="[
            PRESET,
            'border-dashed',
            debugSelected
              ? 'border-danger bg-accent-soft text-danger'
              : 'border-text-muted bg-surface text-text-muted hover:text-text-primary',
          ]" :aria-pressed="debugSelected" @click="setMs(DEBUG_MS)">
            5 s
          </button>
        </div>

        <!-- Dial -->
        <div class="flex justify-center">
          <DurationDial ref="dial" v-model="minutes" :min="range.min" :max="range.max" />
        </div>
      </section>
    </div>
  </Teleport>
</template>
