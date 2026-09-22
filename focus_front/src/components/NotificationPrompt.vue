<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'
import { notificationKind } from '@/types/notification'

const notifications = useNotificationsStore()

const copy = computed(() =>
  notifications.asking === null ? null : notificationKind(notifications.asking).prompt,
)

const dismiss = ref(false)
const sheet = ref<HTMLElement | null>(null)

function decline() {
  void notifications.declinePrompt(dismiss.value)
}

function accept() {
  void notifications.acceptPrompt(dismiss.value)
}

function onBackdropPointerDown(event: PointerEvent) {
  if (!sheet.value?.contains(event.target as Node)) decline()
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') decline()
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  sheet.value?.focus()
})

onUnmounted(() => document.removeEventListener('keydown', onKeyDown))

const FOOTER_BUTTON =
  'h-12 cursor-pointer rounded-xl border px-5 text-body font-medium transition-colors duration-150 motion-reduce:transition-none'
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-30 flex items-center justify-center bg-[rgba(7,10,18,0.45)]"
      @pointerdown="onBackdropPointerDown"
    >
      <section
        ref="sheet"
        class="relative box-border w-100 rounded-[18px] border border-border bg-surface-elevated px-8 pt-7 pb-6 outline-none"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
      >
        <h2 class="mb-2 text-subtitle font-medium">{{ copy?.title }}</h2>

        <p class="mb-6 text-body text-text-secondary">{{ copy?.body }}</p>

        <!-- Stop asking -->
        <label class="mb-6 flex cursor-pointer items-center gap-2.5 text-tiny text-text-muted">
          <input v-model="dismiss" type="checkbox" class="size-4 accent-accent" />
          Don't ask again
        </label>

        <!-- Footer -->
        <div class="flex justify-end gap-3">
          <button
            type="button"
            :class="[
              FOOTER_BUTTON,
              'border-border bg-surface text-text-secondary hover:border-text-muted hover:bg-background hover:text-text-primary',
            ]"
            @click="decline()"
          >
            No thanks
          </button>
          <button
            type="button"
            :class="[
              FOOTER_BUTTON,
              'border-transparent bg-accent text-background hover:bg-accent-hover',
            ]"
            @click="accept()"
          >
            {{ copy?.accept }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>
