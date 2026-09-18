<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'

defineProps<{
  to: RouteLocationRaw
  label: string
}>()
</script>

<template>
  <RouterLink v-slot="{ href, navigate, isExactActive }" :to="to" custom>
    <!-- Link -->
    <a :href="href" :aria-current="isExactActive ? 'page' : undefined"
      class="relative flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-body no-underline transition-colors duration-200 ease-in-out motion-reduce:transition-none"
      :class="isExactActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'" @click="navigate">
      <!-- Icon -->
      <span class="flex size-4.5 shrink-0 items-center justify-center">
        <slot name="icon" />
      </span>

      <!-- Label -->
      <span class="truncate">{{ label }}</span>
    </a>
  </RouterLink>
</template>
