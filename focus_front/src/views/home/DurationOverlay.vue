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

const PHASES = ['focus', 'break'] as const

const RANGES = {
  focus: {
    min: FOCUS_MIN_MS / MINUTE_MS,
    max: FOCUS_MAX_MS / MINUTE_MS,
    presets: [15, 25, 30, 45, 60],
  },
  break: { min: BREAK_MIN_MS / MINUTE_MS, max: BREAK_MAX_MS / MINUTE_MS, presets: [5, 10, 15, 30] },
} as const

const range = computed(() => RANGES[props.target])

// #region Draft
const draft = ref<Record<TimerPhase, number>>({
  focus: settings.focusMs,
  break: settings.breakMs,
})

function savedMs(phase: TimerPhase) {
  return phase === 'focus' ? settings.focusMs : settings.breakMs
}

const minutes = computed({
  get: () => Math.round(draft.value[props.target] / MINUTE_MS),
  set: (value: number) => (draft.value[props.target] = value * MINUTE_MS),
})

const pending = computed(() => PHASES.filter((phase) => draft.value[phase] !== savedMs(phase)))

async function confirm() {
  for (const phase of pending.value) {
    if (phase === 'focus') await settings.setFocusMs(draft.value.focus)
    else await settings.setBreakMs(draft.value.break)
  }

  emit('close')
}
// #endregion

// TODO: remove with DEBUG_MS.
const showDebugPreset = import.meta.env.DEV
const debugSelected = computed(() => draft.value[props.target] === DEBUG_MS)

// #region Closing
const sheet = ref<HTMLElement | null>(null)
const dial = ref<InstanceType<typeof DurationDial> | null>(null)

function onBackdropPointerDown(event: PointerEvent) {
  if (!sheet.value?.contains(event.target as Node)) emit('close')
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
  if (event.key === 'Enter' && !(document.activeElement instanceof HTMLButtonElement)) void confirm()
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
const FOOTER_BUTTON =
  'h-12 w-28 cursor-pointer rounded-xl border text-body font-medium transition-colors duration-150 motion-reduce:transition-none'
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(7,10,18,0.72)]"
      @pointerdown="onBackdropPointerDown"
    >
      <section
        ref="sheet"
        class="relative box-border w-130 rounded-[18px] border border-border bg-surface-elevated px-8 pt-7 pb-6"
        role="dialog"
        aria-modal="true"
        aria-label="Session length"
      >
        <h2 class="mb-5 text-subtitle font-medium">How long this time?</h2>

        <!-- Target -->
        <div class="mb-5 flex gap-1 rounded-[10px] border border-border bg-surface p-1">
          <button
            type="button"
            :class="[TARGET_BUTTON, target === 'focus' ? 'bg-surface-elevated' : '']"
            :aria-pressed="target === 'focus'"
            @click="emit('update:target', 'focus')"
          >
            <span
              class="text-[11px] tracking-[0.08em] uppercase"
              :class="target === 'focus' ? 'text-text-primary' : 'text-text-muted'"
              >Focus</span
            >
            <span
              class="font-clock text-body"
              :class="target === 'focus' ? 'text-text-primary' : 'text-text-secondary'"
              >{{ formatMinutes(draft.focus) }}</span
            >
          </button>
          <button
            type="button"
            :class="[TARGET_BUTTON, target === 'break' ? 'bg-surface-elevated' : '']"
            :aria-pressed="target === 'break'"
            @click="emit('update:target', 'break')"
          >
            <span
              class="text-[11px] tracking-[0.08em] uppercase"
              :class="target === 'break' ? 'text-text-primary' : 'text-text-muted'"
              >Break</span
            >
            <span
              class="font-clock text-body"
              :class="target === 'break' ? 'text-text-primary' : 'text-text-secondary'"
              >{{ formatMinutes(draft.break) }}</span
            >
          </button>
        </div>

        <!-- Presets -->
        <div class="mb-6 flex gap-2">
          <button
            v-for="preset in range.presets"
            :key="preset"
            type="button"
            :class="[
              PRESET,
              preset === minutes && !debugSelected
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-border bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary',
            ]"
            :aria-pressed="preset === minutes && !debugSelected"
            @click="minutes = preset"
          >
            {{ preset }} min
          </button>

          <!-- TODO: remove with DEBUG_MS. -->
          <button
            v-if="showDebugPreset"
            type="button"
            :class="[
              PRESET,
              'border-dashed',
              debugSelected
                ? 'border-danger bg-accent-soft text-danger'
                : 'border-text-muted bg-surface text-text-muted hover:text-text-primary',
            ]"
            :aria-pressed="debugSelected"
            @click="draft[target] = DEBUG_MS"
          >
            5 s
          </button>
        </div>

        <!-- Dial -->
        <div class="flex justify-center">
          <DurationDial ref="dial" v-model="minutes" :min="range.min" :max="range.max" />
        </div>

        <!-- Footer -->
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            :class="[
              FOOTER_BUTTON,
              'border-border bg-surface text-text-secondary hover:border-text-muted hover:bg-background hover:text-text-primary',
            ]"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="button"
            :class="[
              FOOTER_BUTTON,
              'border-transparent bg-accent text-background hover:bg-accent-hover',
            ]"
            @click="confirm()"
          >
            Done
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
