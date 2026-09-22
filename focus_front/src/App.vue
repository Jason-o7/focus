<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import NotificationPrompt from '@/components/NotificationPrompt.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useTimerStore } from '@/stores/timer'

const timer = useTimerStore()

const notifications = useNotificationsStore()

// TODO: remember this between reloads once api/ exists.
const collapsed = ref(false)

const sessionActive = computed(() => timer.status !== 'stopped')

watch(sessionActive, (active) => (collapsed.value = active))
</script>

<template>
  <div class="relative h-full overflow-hidden bg-background">
    <!-- Sidebar -->
    <AppSidebar :collapsed="collapsed" />

    <!-- Sidebar toggle -->
    <button
      type="button"
      class="absolute top-6 z-20 flex size-10 items-center justify-center rounded-[10px] border border-border bg-surface text-text-secondary transition-[left,color] duration-150 ease-in-out hover:text-text-primary motion-reduce:transition-none"
      :class="collapsed ? 'left-6' : 'left-66'"
      :aria-expanded="!collapsed"
      aria-label="Hide or show the menu"
      @click="collapsed = !collapsed"
    >
      <!-- Sidebar toggle icon -->
      <svg
        class="size-4.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 4v16" />
      </svg>
    </button>

    <!-- Views -->
    <main
      class="h-full transition-[padding-left] duration-150 ease-in-out motion-reduce:transition-none"
      :class="collapsed ? 'pl-0' : 'pl-60'"
    >
      <RouterView />
    </main>

    <!-- Notifications prompt -->
    <NotificationPrompt v-if="notifications.promptOpen" />
  </div>
</template>
