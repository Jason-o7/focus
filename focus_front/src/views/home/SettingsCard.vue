<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, useTemplateRef, watch } from 'vue'
import { useBackgroundsStore } from '@/stores/backgrounds'
import { useHomeStore } from '@/stores/home'
import { useSettingsStore } from '@/stores/settings'
import { useSoundsStore } from '@/stores/sounds'

const settings = useSettingsStore()
const sounds = useSoundsStore()
const backgrounds = useBackgroundsStore()
const home = useHomeStore()

const CHIP_BASE =
  'cursor-pointer rounded-full border px-3 py-2.5 text-tiny leading-none transition-colors duration-150 motion-reduce:transition-none'

function chipClass(selected: boolean) {
  return selected
    ? 'border-accent bg-accent-soft text-accent'
    : 'border-border bg-surface text-text-secondary hover:border-text-muted hover:text-text-primary'
}

const eyeBreakInfoPinned = ref(false)
const eyeBreakInfoHovered = ref(false)
const showEyeBreakInfo = computed(() => eyeBreakInfoPinned.value || eyeBreakInfoHovered.value)
const eyeBreakInfo = useTemplateRef<HTMLElement>('eyeBreakInfo')

function unpinEyeBreakInfoOnOutsideClick(event: MouseEvent) {
  if (!eyeBreakInfo.value?.contains(event.target as Node)) eyeBreakInfoPinned.value = false
}

watch(eyeBreakInfoPinned, (pinned) => {
  if (pinned) document.addEventListener('click', unpinEyeBreakInfoOnOutsideClick)
  else document.removeEventListener('click', unpinEyeBreakInfoOnOutsideClick)
})

onUnmounted(() => document.removeEventListener('click', unpinEyeBreakInfoOnOutsideClick))

// TODO: the add and remove interaction is not designed yet.
const addingPreset = ref(false)
const presetDraft = ref('')
const presetInput = useTemplateRef<HTMLInputElement>('presetInput')

async function startAddingPreset() {
  addingPreset.value = true
  await nextTick()
  presetInput.value?.focus()
}

async function confirmPreset() {
  await settings.addEyeBreakPreset(Number(presetDraft.value))
  presetDraft.value = ''
  addingPreset.value = false
}

function cancelPreset() {
  presetDraft.value = ''
  addingPreset.value = false
}
</script>

<template>
  <!-- Bubble -->
  <button
    type="button"
    class="absolute bottom-6 left-6 flex size-14 origin-bottom-left transform-gpu cursor-pointer will-change-[opacity,scale] items-center justify-center rounded-full border border-border bg-surface-elevated text-text-secondary transition-[opacity,scale] duration-200 ease-out hover:text-text-primary motion-reduce:transition-none"
    :class="
      home.settingsCardCollapsed
        ? 'scale-100 opacity-100'
        : 'pointer-events-none scale-75 opacity-0'
    "
    :inert="!home.settingsCardCollapsed"
    aria-label="Show options"
    @click="home.setSettingsCardCollapsed(false)"
  >
    <svg
      class="size-5.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.7"
      stroke-linecap="round"
    >
      <path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
      <circle cx="16" cy="8" r="2.2" />
      <circle cx="10" cy="16" r="2.2" />
    </svg>
  </button>

  <!-- Card -->
  <section
    class="absolute bottom-6 left-6 box-border w-76 origin-bottom-left transform-gpu rounded-[14px] will-change-[opacity,scale] border border-border bg-surface-elevated px-3.5 pt-3.5 pb-3.5 transition-[opacity,scale] duration-200 ease-out motion-reduce:transition-none"
    :class="
      home.settingsCardCollapsed
        ? 'pointer-events-none scale-90 opacity-0'
        : 'scale-100 opacity-100'
    "
    :inert="home.settingsCardCollapsed"
    aria-label="Session settings"
  >
    <!-- Card - Collapse button -->
    <button
      type="button"
      class="absolute top-3 right-3 flex size-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors duration-150 hover:border-text-muted hover:bg-background hover:text-text-primary motion-reduce:transition-none"
      aria-label="Hide options"
      @click="home.setSettingsCardCollapsed(true)"
    >
      <svg
        class="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <!-- Card - Load error -->
    <p
      v-if="settings.loadFailed"
      class="mb-3.5 flex items-start gap-1 pr-6 text-tiny text-danger"
      role="alert"
    >
      <svg
        class="mt-px size-3.5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      There was a problem loading your settings. Please refresh the page to try again.
    </p>

    <!-- Card - Body -->
    <div :class="settings.canEdit ? '' : 'pointer-events-none opacity-40'">
      <!-- Card - Sound -->
      <div>
        <!-- Card - Sound - Header -->
        <p class="mb-2.5 text-tiny text-text-muted">
          Something to <b class="text-body font-semibold text-text-primary">hear</b>
        </p>
        <!-- Card - Sound - Content -->
        <p v-if="sounds.loadFailed" class="text-tiny text-danger" role="alert">
          The sounds could not be loaded. Please refresh the page to try again.
        </p>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="sound in sounds.items"
            :key="sound.id"
            type="button"
            :class="[CHIP_BASE, chipClass(settings.soundId === sound.id)]"
            :aria-pressed="settings.soundId === sound.id"
            @click="settings.selectSound(sound.id)"
          >
            {{ sound.label }}
          </button>
        </div>
      </div>

      <!-- Card - Background -->
      <div class="mt-4.5">
        <p class="mb-2.5 text-tiny text-text-muted">
          Something to <b class="text-body font-semibold text-text-primary">see</b>
        </p>
        <p v-if="backgrounds.loadFailed" class="text-tiny text-danger" role="alert">
          The backgrounds could not be loaded. Please refresh the page to try again
        </p>
        <div v-else class="flex gap-2.5">
          <button
            v-for="background in backgrounds.items"
            :key="background.id"
            type="button"
            class="size-14 cursor-pointer rounded-[10px] border bg-surface p-0 transition-colors duration-150 motion-reduce:transition-none"
            :class="
              settings.backgroundId === background.id
                ? 'border-accent'
                : 'border-border hover:border-text-muted'
            "
            :aria-pressed="settings.backgroundId === background.id"
            :aria-label="background.label"
            @click="settings.selectBackground(background.id)"
          />
        </div>
      </div>

      <!-- Card - Eye break -->
      <div class="mt-4.5">
        <!-- Eye break - Header -->
        <div class="mb-2.5 flex items-center justify-between gap-3">
          <div class="flex items-center gap-1.5">
            <p class="text-tiny text-text-muted">
              A break for your <b class="text-body font-semibold text-text-primary">eyes</b>
            </p>

            <!-- Eye break - Info toggle -->
            <span ref="eyeBreakInfo" class="relative flex">
              <button
                type="button"
                class="flex size-4 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-colors duration-150 motion-reduce:transition-none"
                :class="showEyeBreakInfo ? 'text-info' : 'text-text-muted hover:text-text-primary'"
                :aria-expanded="showEyeBreakInfo"
                aria-label="What this does"
                @click="eyeBreakInfoPinned = !eyeBreakInfoPinned"
                @mouseenter="eyeBreakInfoHovered = true"
                @mouseleave="eyeBreakInfoHovered = false"
              >
                <svg
                  class="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
              </button>

              <!-- Info toggle - Tooltip -->
              <p
                v-if="showEyeBreakInfo"
                class="absolute bottom-full left-0 z-10 mb-2 w-60 rounded-[10px] border border-border bg-surface px-3 py-2.5 text-tiny leading-relaxed text-text-secondary shadow-lg"
              >
                When the time is up we send you a
                <b class="font-semibold text-text-primary">notification</b>, so you can look far
                away for <b class="font-semibold text-text-primary">20</b> seconds.
              </p>
            </span>
          </div>

          <label class="relative inline-flex shrink-0 cursor-pointer">
            <input
              type="checkbox"
              class="peer absolute inset-0 m-0 cursor-pointer opacity-0"
              :checked="settings.eyeBreakEnabled"
              @change="settings.toggleEyeBreak()"
            />
            <span
              class="box-border h-6 w-11 rounded-full border transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-accent motion-reduce:transition-none"
              :class="
                settings.eyeBreakEnabled ? 'border-accent bg-accent' : 'border-border bg-background'
              "
            >
              <span
                class="m-0.75 block size-4 rounded-full transition-transform duration-150 motion-reduce:transition-none"
                :class="
                  settings.eyeBreakEnabled ? 'translate-x-5 bg-background' : 'bg-text-secondary'
                "
              />
            </span>
            <span class="sr-only">Remind me to rest my eyes</span>
          </label>
        </div>

        <!-- Eye break - Intervals -->
        <div
          class="flex flex-wrap gap-1 transition-opacity duration-150 motion-reduce:transition-none"
          :class="settings.eyeBreakEnabled ? 'opacity-100' : 'pointer-events-none opacity-35'"
        >
          <span
            v-for="minutes in settings.eyeBreakPresets"
            :key="minutes"
            class="inline-flex items-center rounded-full border text-tiny leading-none transition-colors duration-150 motion-reduce:transition-none"
            :class="chipClass(settings.eyeBreakMinutes === minutes)"
          >
            <button
              type="button"
              class="cursor-pointer rounded-l-full border-0 bg-transparent py-2.5 pr-1 pl-3 text-inherit"
              :disabled="!settings.eyeBreakEnabled"
              :aria-pressed="settings.eyeBreakMinutes === minutes"
              @click="settings.setEyeBreakMinutes(minutes)"
            >
              {{ minutes }} min
            </button>

            <button
              type="button"
              class="mr-1 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-inherit transition-colors duration-150 hover:bg-current/20 disabled:invisible motion-reduce:transition-none"
              :disabled="!settings.eyeBreakEnabled || settings.eyeBreakPresets.length <= 1"
              :aria-label="`Remove ${minutes} min`"
              @click="settings.removeEyeBreakPreset(minutes)"
            >
              <svg
                class="size-2.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </span>

          <!-- Intervals - Add -->
          <span
            v-if="addingPreset"
            class="inline-flex items-center gap-1 rounded-full border border-dashed border-accent bg-surface px-3 py-2.5 text-tiny leading-none text-text-primary"
          >
            <input
              ref="presetInput"
              v-model="presetDraft"
              type="text"
              inputmode="numeric"
              maxlength="2"
              class="w-4 border-0 bg-transparent p-0 text-tiny leading-none text-text-primary outline-none"
              aria-label="New interval in minutes"
              @keydown.enter="confirmPreset"
              @keydown.esc="cancelPreset"
              @blur="confirmPreset"
            />
            min
          </span>

          <button
            v-else
            type="button"
            class="inline-flex items-center"
            :class="[CHIP_BASE, chipClass(false)]"
            :disabled="!settings.eyeBreakEnabled"
            aria-label="Add another interval"
            @click="startAddingPreset"
          >
            <svg
              class="size-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Card - Save error -->
    <p
      v-if="settings.saveFailed"
      class="mt-4.5 flex items-start gap-2 text-tiny text-danger"
      role="alert"
    >
      <svg
        class="mt-px size-3.5 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      There was a problem saving your settings. Please refresh the page and try again.
    </p>
  </section>
</template>
