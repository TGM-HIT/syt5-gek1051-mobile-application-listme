import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ListDetailView from '../views/ListDetailView.vue'
import JoinListView from '../views/JoinListView.vue'
import SyncApplyView from '../views/SyncApplyView.vue'
import SettingsView from '../views/SettingsView.vue'
import TrashView from '../views/TrashView.vue'
import LibraryView from '../views/LibraryView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
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
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
  ],
})

export default router
