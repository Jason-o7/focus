<script setup lang="ts">
import { ref } from 'vue'
import { useBackgroundsStore } from '@/stores/backgrounds'
import { EYE_BREAK_PRESETS, useSettingsStore } from '@/stores/settings'
import { useSoundsStore } from '@/stores/sounds'

const settings = useSettingsStore()
const sounds = useSoundsStore()
const backgrounds = useBackgroundsStore()

// TODO: collapse it on its own once the timer store says the session is running.
const collapsed = ref(false)

const CHIP_BASE =
  'cursor-pointer rounded-full border px-3 py-2.5 text-tiny leading-none transition-colors duration-150 motion-reduce:transition-none'

function chipClass(selected: boolean) {
  return selected
    ? 'border-accent bg-accent-soft text-accent'
    : 'border-border bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary'
}
</script>

<template>
  <!-- Card -->
  <section
    class="absolute bottom-6 left-6 box-border border border-border bg-surface-elevated transition-[width,border-radius] duration-200 ease-in-out motion-reduce:transition-none"
    :class="collapsed ? 'w-14 rounded-full p-0' : 'w-76 rounded-[14px] px-4.5 pt-4 pb-4.5'"
    aria-label="Session settings">
    <!-- Card - Bubble -->
    <button v-if="collapsed" type="button"
      class="flex size-14 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text-secondary hover:text-text-primary"
      aria-label="Show options" @click="collapsed = false">
      <svg class="size-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
        stroke-linecap="round">
        <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
        <circle cx="16" cy="8" r="2.2" />
        <circle cx="10" cy="16" r="2.2" />
      </svg>
    </button>

    <template v-else>
      <!-- Card - Collapse button -->
      <button type="button"
        class="absolute top-3 right-3 flex size-6.5 cursor-pointer items-center justify-center rounded-[7px] border-0 bg-transparent text-text-muted hover:bg-surface hover:text-text-primary"
        aria-label="Hide options" @click="collapsed = true">
        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <!-- Card - Sound -->
      <div>
        <!-- Card - Sound - Header -->
        <p class="mb-2.5 text-tiny text-text-muted">
          Something to <b class="text-body font-semibold text-text-primary">hear</b>
        </p>
        <!-- Card - Sound - Content -->
        <div class="flex flex-wrap gap-2">
          <button v-for="sound in sounds.items" :key="sound.id" type="button"
            :class="[CHIP_BASE, chipClass(settings.soundId === sound.id)]" :aria-pressed="settings.soundId === sound.id"
            @click="settings.selectSound(sound.id)">
            {{ sound.label }}
          </button>
        </div>
      </div>

      <!-- Card - Background -->
      <div class="mt-4.5">
        <p class="mb-2.5 text-tiny text-text-muted">
          Something to <b class="text-body font-semibold text-text-primary">see</b>
        </p>
        <div class="flex gap-2.5">
          <button v-for="background in backgrounds.items" :key="background.id" type="button"
            class="size-14 cursor-pointer rounded-[10px] border bg-surface p-0 transition-colors duration-150 motion-reduce:transition-none"
            :class="settings.backgroundId === background.id ? 'border-accent' : 'border-border hover:border-text-muted'"
            :aria-pressed="settings.backgroundId === background.id" :aria-label="background.label"
            @click="settings.selectBackground(background.id)" />
        </div>
      </div>

      <!-- Card - Eye break -->
      <div class="mt-4.5">
        <!-- Eye break - Header -->
        <div class="mb-2.5 flex items-center justify-between gap-3">
          <p class="text-tiny text-text-muted">
            A break for your <b class="text-body font-semibold text-text-primary">eyes</b>
          </p>

          <label class="relative inline-flex shrink-0 cursor-pointer">
            <input type="checkbox" class="peer absolute inset-0 m-0 cursor-pointer opacity-0"
              :checked="settings.eyeBreakEnabled" @change="settings.toggleEyeBreak()">
            <span
              class="box-border h-6 w-11 rounded-full border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-accent motion-reduce:transition-none"
              :class="settings.eyeBreakEnabled ? 'border-accent bg-accent' : 'border-border bg-background'">
              <span
                class="m-0.75 block size-4 rounded-full transition-transform duration-150 motion-reduce:transition-none"
                :class="settings.eyeBreakEnabled ? 'translate-x-5 bg-background' : 'bg-text-secondary'" />
            </span>
            <span class="sr-only">Remind me to rest my eyes</span>
          </label>
        </div>

        <!-- Eye break - Intervals -->
        <div class="flex flex-wrap gap-2 transition-opacity duration-150 motion-reduce:transition-none"
          :class="settings.eyeBreakEnabled ? 'opacity-100' : 'pointer-events-none opacity-35'">
          <button v-for="minutes in EYE_BREAK_PRESETS" :key="minutes" type="button"
            :class="[CHIP_BASE, chipClass(settings.eyeBreakMinutes === minutes)]" :disabled="!settings.eyeBreakEnabled"
            :aria-pressed="settings.eyeBreakMinutes === minutes" @click="settings.setEyeBreakMinutes(minutes)">
            {{ minutes }} min
          </button>

          <!-- TODO: prompt for a custom interval. -->
          <button type="button"
            class="cursor-pointer rounded-full border border-dashed border-border bg-transparent px-3.5 py-2 text-subtitle leading-none text-text-muted transition-colors duration-150 hover:border-text-muted hover:text-text-primary motion-reduce:transition-none"
            :disabled="!settings.eyeBreakEnabled" aria-label="Add another interval">
            +
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
