<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'

const props = defineProps<{
  modelValue: number
  min: number
  max: number
}>()

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const RADIUS = 88
const CENTER = 110
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const dial = useTemplateRef<HTMLElement>('dial')
const dragging = ref(false)
const hovered = ref(false)

const handleRadius = computed(() => (hovered.value || dragging.value ? 17 : 14))

const fraction = computed(() => (props.modelValue - props.min) / (props.max - props.min))

function pointOnRing(fractionOfTurn: number, radius: number) {
  const angle = fractionOfTurn * 2 * Math.PI - Math.PI / 2
  return { x: CENTER + radius * Math.cos(angle), y: CENTER + radius * Math.sin(angle) }
}

const handle = computed(() => pointOnRing(fraction.value, RADIUS))

// #region Ticks
const TICK_COUNT = 36

const ticks = computed(() =>
  Array.from({ length: TICK_COUNT }, (_, index) => {
    const turn = index / TICK_COUNT
    const long = index % 3 === 0
    const inner = pointOnRing(turn, 99)
    const outer = pointOnRing(turn, long ? 107 : 103)
    return { ...inner, x2: outer.x, y2: outer.y, opacity: long ? 0.9 : 0.45 }
  }),
)
// #endregion

// #region Input
function commit(value: number) {
  const clamped = Math.min(props.max, Math.max(props.min, Math.round(value)))
  if (clamped !== props.modelValue) emit('update:modelValue', clamped)
}

function fromPointer(event: PointerEvent) {
  const box = dial.value?.getBoundingClientRect()
  if (box === undefined) return

  const dx = event.clientX - (box.left + box.width / 2)
  const dy = event.clientY - (box.top + box.height / 2)

  let angle = Math.atan2(dy, dx) + Math.PI / 2
  if (angle < 0) angle += 2 * Math.PI

  const span = props.max - props.min
  const value = props.min + (angle / (2 * Math.PI)) * span
  if (Math.abs(value - props.modelValue) > span / 2) return

  commit(value)
}

function onPointerDown(event: PointerEvent) {
  dial.value?.setPointerCapture(event.pointerId)
  dragging.value = true
  fromPointer(event)
}

function onPointerMove(event: PointerEvent) {
  if (dragging.value) fromPointer(event)
}

function onPointerUp() {
  dragging.value = false
}

function onKeyDown(event: KeyboardEvent) {
  const step = event.key === 'PageUp' || event.key === 'PageDown' ? 5 : 1

  const delta =
    event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'PageUp'
      ? step
      : event.key === 'ArrowLeft' || event.key === 'ArrowDown' || event.key === 'PageDown'
        ? -step
        : 0

  if (delta !== 0) {
    event.preventDefault()
    commit(props.modelValue + delta)
    return
  }

  if (event.key === 'Home') {
    event.preventDefault()
    commit(props.min)
  }
  if (event.key === 'End') {
    event.preventDefault()
    commit(props.max)
  }
}
// #endregion
</script>

<template>
  <div ref="dial" class="group relative size-55 touch-none rounded-full outline-none"
    :class="dragging ? 'cursor-grabbing' : 'cursor-grab'" tabindex="0" role="slider" aria-label="Minutes"
    :aria-valuemin="min" :aria-valuemax="max" :aria-valuenow="modelValue" @pointerdown="onPointerDown"
    @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp" @keydown="onKeyDown"
    @pointerenter="hovered = true" @pointerleave="hovered = false">
    <svg class="block size-55" viewBox="0 0 220 220">
      <!-- Ticks -->
      <g class="stroke-text-muted" stroke-width="2" stroke-linecap="round">
        <line v-for="(tick, index) in ticks" :key="index" :x1="tick.x" :y1="tick.y" :x2="tick.x2" :y2="tick.y2"
          :opacity="tick.opacity" />
      </g>

      <!-- Track -->
      <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" fill="none" class="stroke-border" stroke-width="10" />

      <!-- Filled arc -->
      <circle :cx="CENTER" :cy="CENTER" :r="RADIUS" fill="none" class="stroke-accent" stroke-width="10"
        stroke-linecap="round" :transform="`rotate(-90 ${CENTER} ${CENTER})`" :stroke-dasharray="CIRCUMFERENCE"
        :stroke-dashoffset="CIRCUMFERENCE * (1 - fraction)" />

      <!-- Handle -->
      <circle :cx="handle.x" :cy="handle.y" :r="handleRadius"
        class="fill-background stroke-accent transition-[r] duration-150 motion-reduce:transition-none"
        stroke-width="3" />
      <circle :cx="handle.x" :cy="handle.y" r="4" class="fill-accent" />
    </svg>

    <!-- Readout -->
    <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
      <span class="font-clock text-[40px] text-text-primary">{{ modelValue }}</span>
      <span class="mt-0.5 text-tiny tracking-[0.08em] text-text-muted uppercase">minutes</span>
    </div>

    <!-- Focus ring -->
    <span
      class="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent opacity-0 group-focus-visible:opacity-100" />
  </div>
</template>
