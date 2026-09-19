<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ value: string }>()

const FLIP_MS = 320

const JUMP_AFTER_MS = 1_500

interface Cell {
  char: string
  previous: string
  flipping: boolean
}

const cells = ref<Cell[]>(toCells(props.value))
const timers = new Map<number, ReturnType<typeof setTimeout>>()
let lastChangeAt = Date.now()

function toCells(value: string): Cell[] {
  return [...value].map((char) => ({ char, previous: char, flipping: false }))
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function paint(value: string) {
  timers.forEach(clearTimeout)
  timers.clear()
  cells.value = toCells(value)
}

function flip(index: number, char: string) {
  const cell = cells.value[index]
  if (cell === undefined) return

  clearTimeout(timers.get(index))

  cell.previous = cell.char
  cell.char = char
  cell.flipping = true

  timers.set(
    index,
    setTimeout(() => {
      const current = cells.value[index]
      if (current !== undefined) current.flipping = false
      timers.delete(index)
    }, FLIP_MS),
  )
}

watch(
  () => props.value,
  (next) => {
    const at = Date.now()
    const jumped = at - lastChangeAt > JUMP_AFTER_MS
    lastChangeAt = at

    if (jumped || prefersReducedMotion() || next.length !== cells.value.length) {
      paint(next)
      return
    }

    ;[...next].forEach((char, index) => {
      if (cells.value[index]?.char !== char) flip(index, char)
    })
  },
)

onUnmounted(() => timers.forEach(clearTimeout))
</script>

<template>
  <div class="flex" aria-hidden="true">
    <template v-for="(cell, index) in cells" :key="index">
      <!-- Separator -->
      <span v-if="cell.char === ':'" class="flip-cell flex items-center justify-center">{{ cell.char }}</span>

      <!-- Digit -->
      <span v-else class="flip-cell">
        <span class="flip-half flip-half-top">
          <span class="flip-glyph flip-glyph-top">{{ cell.flipping ? cell.previous : cell.char }}</span>
        </span>
        <span class="flip-half flip-half-bottom">
          <span class="flip-glyph flip-glyph-bottom">{{ cell.char }}</span>
        </span>

        <template v-if="cell.flipping">
          <span class="flip-half flip-half-bottom flip-leaf flip-leaf-up">
            <span class="flip-glyph flip-glyph-bottom">{{ cell.previous }}</span>
          </span>
          <span class="flip-half flip-half-top flip-leaf flip-leaf-down">
            <span class="flip-glyph flip-glyph-top">{{ cell.char }}</span>
          </span>
        </template>
      </span>
    </template>
  </div>

  <span class="sr-only" role="timer">{{ props.value }}</span>
</template>

<style scoped>
.flip-cell {
  position: relative;
  display: block;
  width: 1ch;
  height: 1.15em;
  perspective: 20em;
}

.flip-half {
  position: absolute;
  left: 0;
  width: 100%;
  height: 50%;
  overflow: hidden;
}

.flip-half-top {
  top: 0;
}

.flip-half-bottom {
  bottom: 0;
}

.flip-glyph {
  position: absolute;
  left: 0;
  width: 100%;
  height: 1.15em;
  line-height: 1.15em;
  text-align: center;
}

.flip-glyph-top {
  top: 0;
}

.flip-glyph-bottom {
  bottom: 0;
}

.flip-leaf {
  background: var(--color-background);
  backface-visibility: hidden;
}

.flip-leaf-up {
  transform-origin: top;
  animation: flip-up 160ms ease-in forwards;
}

.flip-leaf-down {
  transform-origin: bottom;
  animation: flip-down 160ms 160ms ease-out both;
}

@keyframes flip-up {
  from {
    transform: rotateX(0deg);
  }
  to {
    transform: rotateX(90deg);
  }
}

@keyframes flip-down {
  from {
    transform: rotateX(-90deg);
  }
  to {
    transform: rotateX(0deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .flip-leaf {
    animation: none;
  }
}
</style>
