import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/home/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/stats/StatsView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/SettingsView.vue'),
    },
  ],
})

// TODO: real auth check here once Login exists
router.beforeEach(() => true)

export default router
