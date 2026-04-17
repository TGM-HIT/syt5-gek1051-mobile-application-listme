import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ListDetailView from '../views/ListDetailView.vue'
import JoinListView from '../views/JoinListView.vue'
import SyncApplyView from '../views/SyncApplyView.vue'
import SettingsView from '../views/SettingsView.vue'
import TrashView from '../views/TrashView.vue'
import LibraryView from '../views/LibraryView.vue'
import { getOrCreateUserId, setUserId } from '../services/userId'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Static routes must be declared before /:userId so Vue Router ranks them higher
    {
      path: '/s/:token',
      name: 'join-list',
      component: JoinListView,
      meta: { hideChrome: true },
    },
    {
      path: '/sync/:token',
      name: 'sync-apply',
      component: SyncApplyView,
      meta: { hideChrome: true },
    },
    {
      path: '/list/:id',
      name: 'list-detail',
      component: ListDetailView,
      meta: { hideChrome: true },
    },
    {
      path: '/list/:id/trash',
      name: 'list-trash',
      component: TrashView,
      meta: { hideChrome: true },
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    // /<userId> — the permanent user home link
    {
      path: '/:userId',
      name: 'home',
      component: HomeView,
      beforeEnter: (to) => {
        const userId = to.params.userId as string
        if (!UUID_RE.test(userId)) {
          // Not a UUID (e.g. a mistyped path) — redirect to proper home
          return `/${getOrCreateUserId()}`
        }
        // Adopt this userId — works as cross-device "login" when opening the URL on a new device
        setUserId(userId)
      },
    },
    // Root redirects to the user's permanent link
    {
      path: '/',
      redirect: () => `/${getOrCreateUserId()}`,
    },
  ],
})

export default router
