import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'
// Keep in sync with the @media (max-width: 1023px) block in App.vue that switches the sidebar to overlay mode.
const SMALL_QUERY = '(max-width: 1023px)'

// localStorage can throw (private mode, blocked storage) and the app must still render,
// so every access is wrapped in try/catch.
function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// Module-level refs so every caller shares one state (same singleton pattern as useFilters/useI18n).
// userCollapsed is the remembered desktop preference; isSmall tracks the viewport live.
const userCollapsed = ref(readStored())
const mql = typeof window !== 'undefined' ? window.matchMedia(SMALL_QUERY) : null
const isSmall = ref(mql ? mql.matches : false)
// Temporary expansion on small screens. Never persisted, so a narrow-window visit can't
// overwrite the desktop preference.
const overlayOpen = ref(false)

if (mql) {
  mql.addEventListener('change', (e) => {
    isSmall.value = e.matches
    overlayOpen.value = false
  })
}

watch(userCollapsed, (v) => {
  try {
    localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
  } catch {
    // Persisting is best-effort; the in-memory state still works.
  }
})

export function useSidebar() {
  // Small screens are icons-only unless the overlay is open; large screens follow the saved choice.
  const collapsed = computed(() => (isSmall.value ? !overlayOpen.value : userCollapsed.value))

  const toggle = () => {
    if (isSmall.value) overlayOpen.value = !overlayOpen.value
    else userCollapsed.value = !userCollapsed.value
  }

  const closeOverlay = () => {
    overlayOpen.value = false
  }

  return { collapsed, isSmall, overlayOpen, toggle, closeOverlay }
}
