<script setup lang="ts">
import { onMounted } from 'vue'
import { useBackgroundsStore } from '@/stores/backgrounds'
import { useSettingsStore } from '@/stores/settings'
import { useSoundsStore } from '@/stores/sounds'
import SettingsCard from '@/views/home/SettingsCard.vue'

const settings = useSettingsStore()
const sounds = useSoundsStore()
const backgrounds = useBackgroundsStore()

onMounted(() => {
  void Promise.all([settings.load(), sounds.load(), backgrounds.load()])
})
</script>

<template>
  <section class="relative h-full">
    <!-- TODO: mode, clock, durations, action button, streak and goal. -->

    <!-- Session settings -->
    <SettingsCard />
  </section>
</template>
