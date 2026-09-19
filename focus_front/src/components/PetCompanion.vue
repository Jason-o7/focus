<script setup lang="ts">
import { computed } from 'vue'
import focusingPose from '@/assets/pet/focusing.webp'
import idlePose from '@/assets/pet/idle.webp'
import waitingPose from '@/assets/pet/waiting.webp'
import type { PetState } from '@/types/pet'

const props = withDefaults(
  defineProps<{
    state: PetState
    size: number
    mirror?: boolean
  }>(),
  { mirror: false },
)

const IMAGES: Record<PetState, string> = {
  idle: idlePose,
  focusing: focusingPose,
  waiting: waitingPose,
}

const source = computed(() => IMAGES[props.state])
</script>

<template>
  <img
    :src="source"
    :width="size"
    :height="size"
    :class="mirror ? 'scale-x-[-1]' : ''"
    alt=""
    aria-hidden="true"
    draggable="false"
    class="select-none"
  />
</template>
