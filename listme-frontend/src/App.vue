<script setup lang="ts">
import AppHeader from './components/common/AppHeader.vue'
import BottomNav from './components/common/BottomNav.vue'
</script>

<template>
  <div class="min-h-dvh bg-ctp-base text-ctp-text">
    <AppHeader />

    <main class="main-scroll h-dvh overflow-y-auto overscroll-contain">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <BottomNav />
  </div>
</template>

<style scoped>
.page-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-leave-active {
  transition: opacity 0.15s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
}
</style>
