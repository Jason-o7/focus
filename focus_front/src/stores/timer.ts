import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TimerStatus } from '@/types/timer'

export const useTimerStore = defineStore('timer', () => {
  // TODO: the clock itself (mode, target, elapsed) lands here (docs/frontend-arquitectura.md 7.4).
  const status = ref<TimerStatus>('stopped')

  function start() {
    if (status.value !== 'stopped') return
    status.value = 'running'
  }

  function pause() {
    if (status.value !== 'running') return
    status.value = 'paused'
  }

  function resume() {
    if (status.value !== 'paused') return
    status.value = 'running'
  }

  function stop() {
    status.value = 'stopped'
  }

  return { status, start, pause, resume, stop }
})
