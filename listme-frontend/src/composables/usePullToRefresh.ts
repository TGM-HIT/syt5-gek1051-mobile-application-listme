import { ref, onUnmounted } from 'vue'

const THRESHOLD = 72   // px of pull required to trigger refresh
const MAX_PULL  = 110  // px at which the indicator stops moving

export function usePullToRefresh(
  getScrollEl: () => HTMLElement | null,
  onRefresh: () => void,
) {
  const pullY       = ref(0)   // 0 → MAX_PULL, drives the visual
  const isRefreshing = ref(false)

  let startY   = 0
  let tracking = false

  function onTouchStart(e: TouchEvent) {
    const el = getScrollEl()
    if (!el || isRefreshing.value) return
    if (el.scrollTop > 0) return   // Only start PTR when already at the top
    startY   = e.touches[0].clientY
    tracking = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!tracking || isRefreshing.value) return
    const el = getScrollEl()
    if (!el) return

    // If user scrolled down mid-gesture, abort PTR
    if (el.scrollTop > 0) {
      tracking = false
      pullY.value = 0
      return
    }

    const delta = e.touches[0].clientY - startY
    if (delta <= 0) {
      pullY.value = 0
      return
    }

    // Rubber-band damping so it feels natural
    pullY.value = Math.min(MAX_PULL, delta * 0.45)
    e.preventDefault()    // prevent scroll while pulling
  }

  function onTouchEnd() {
    if (!tracking) return
    tracking = false

    if (pullY.value >= THRESHOLD * 0.45) {
      // Snap to threshold position, then reload
      pullY.value = THRESHOLD * 0.45
      isRefreshing.value = true
      setTimeout(() => {
        onRefresh()
      }, 300)
    } else {
      // Spring back
      pullY.value = 0
    }
  }

  function attach() {
    const el = getScrollEl()
    if (!el) return
    el.addEventListener('touchstart',  onTouchStart, { passive: true })
    el.addEventListener('touchmove',   onTouchMove,  { passive: false })
    el.addEventListener('touchend',    onTouchEnd,   { passive: true })
    el.addEventListener('touchcancel', onTouchEnd,   { passive: true })
  }

  function detach() {
    const el = getScrollEl()
    if (!el) return
    el.removeEventListener('touchstart',  onTouchStart)
    el.removeEventListener('touchmove',   onTouchMove)
    el.removeEventListener('touchend',    onTouchEnd)
    el.removeEventListener('touchcancel', onTouchEnd)
  }

  onUnmounted(detach)

  return { pullY, isRefreshing, attach, detach }
}
