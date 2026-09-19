<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import PetCompanion from '@/components/PetCompanion.vue'
import { useBackgroundsStore } from '@/stores/backgrounds'
import { useHomeStore } from '@/stores/home'
import { useSettingsStore } from '@/stores/settings'
import { useSoundsStore } from '@/stores/sounds'
import { useTimerStore } from '@/stores/timer'
import type { PetState } from '@/types/pet'
import type { TimerStatus } from '@/types/timer'
import SettingsCard from '@/views/home/SettingsCard.vue'
import TimerPanel from '@/views/home/TimerPanel.vue'

const settings = useSettingsStore()
const sounds = useSoundsStore()
const backgrounds = useBackgroundsStore()
const timer = useTimerStore()
const home = useHomeStore()

onMounted(async () => {
  await Promise.allSettled([settings.load(), sounds.load(), backgrounds.load()])
  await timer.load()
})

// #region Pet
const PET_BY_STATUS: Record<TimerStatus, PetState> = {
  stopped: 'idle',
  running: 'focusing',
  paused: 'waiting',
}

const petState = computed(() => PET_BY_STATUS[timer.status])
// #endregion

// #region Options card
watch(
  () => timer.status,
  (status) => home.setSettingsCardCollapsed(status !== 'stopped'),
)
// #endregion
</script>

<template>
  <section class="relative h-full">
    <!-- Session timer -->
    <TimerPanel />

    <!-- Session settings -->
    <SettingsCard />

    <!-- Pet -->
    <PetCompanion :state="petState" :size="150" mirror class="absolute right-5 bottom-5" />
  </section>
</template>
