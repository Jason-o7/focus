<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarNavItem from '@/components/SidebarNavItem.vue'

defineProps<{
  collapsed: boolean
}>()

const route = useRoute()

// NOTE: must match the order of the items in the template below.
const ORDER = ['home', 'stats', 'settings']

// Item height (h-11) plus gap (gap-1).
const PITCH = 48

const activeIndex = computed(() => ORDER.indexOf(String(route.name)))
</script>

<template>
  <nav
    class="absolute top-0 left-0 h-full w-60 border-r border-border bg-surface transition-transform duration-150 ease-in-out motion-reduce:transition-none"
    :class="collapsed ? '-translate-x-60' : 'translate-x-0'" :aria-hidden="collapsed" :inert="collapsed"
    aria-label="Main">
    <!-- Sidebar - Brand -->
    <h1 class="absolute top-7 left-8 m-0 flex items-center gap-3 text-title font-bold tracking-tight">
      <span class="size-10 shrink-0 rounded-[10px] border border-dashed border-border" aria-hidden="true" />
      Focus
    </h1>

    <!-- Sidebar - Nav -->
    <div class="absolute top-30 left-4 w-52">
      <!-- Nav - Active indicator -->
      <div
        class="pointer-events-none absolute top-0 left-0 h-11 w-full rounded-[10px] bg-surface-elevated transition-[transform,opacity] duration-200 ease-in-out motion-reduce:transition-none"
        :style="{ transform: `translateY(${Math.max(activeIndex, 0) * PITCH}px)` }"
        :class="activeIndex < 0 ? 'opacity-0' : 'opacity-100'" aria-hidden="true">
        <!-- Active indicator - Left bar -->
        <span class="absolute top-3 -left-4 h-5 w-0.75 rounded-r-[3px] bg-accent" />
      </div>

      <!-- Nav - Items -->
      <div class="relative flex flex-col gap-1">
        <!-- Item 1 - Home -->
        <SidebarNavItem :to="{ name: 'home' }" label="Home">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
              stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </template>
        </SidebarNavItem>

        <!-- Item 2 - Stats -->
        <SidebarNavItem :to="{ name: 'stats' }" label="Your stats">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
              stroke-linejoin="round">
              <path d="M4 20V10" />
              <path d="M10 20V4" />
              <path d="M16 20v-7" />
              <path d="M22 20H2" />
            </svg>
          </template>
        </SidebarNavItem>

        <!-- Item 3 - Settings -->
        <SidebarNavItem :to="{ name: 'settings' }" label="Settings">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
              stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path
                d="M19.9 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.2A1.7 1.7 0 0 0 7.6 19.7l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3.6 14H3.4a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 3.4V3.2a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.2 1.2z" />
            </svg>
          </template>
        </SidebarNavItem>
      </div>
    </div>
  </nav>
</template>
