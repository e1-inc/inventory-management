# Sidebar reference implementation

Adapt this rather than copying it blindly. Rename to match the project, switch between `<script setup>` and `setup()` to match the codebase, and wire in the app's real nav items, i18n function and footer components.

## `composables/useSidebar.js`

```js
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'
// Keep in sync with the CSS breakpoint that switches the sidebar to overlay mode.
const SMALL_QUERY = '(max-width: 1023px)'

// localStorage can throw (private mode, blocked storage), and the app must still render.
function readStored() {
  try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
}

// Module-level refs so every caller shares one state (same singleton pattern as other composables).
// userCollapsed is the remembered desktop preference; isSmall tracks the viewport live.
const userCollapsed = ref(readStored())
const mql = typeof window !== 'undefined' ? window.matchMedia(SMALL_QUERY) : null
const isSmall = ref(mql ? mql.matches : false)
// Temporary expansion on small screens. Never persisted, so a phone visit can't flip the desktop preference.
const overlayOpen = ref(false)

mql?.addEventListener('change', (e) => {
  isSmall.value = e.matches
  overlayOpen.value = false
})

watch(userCollapsed, (v) => {
  try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch {}
})

export function useSidebar() {
  // Small screens are icons-only unless the user opens the overlay; large screens follow the saved choice.
  const collapsed = computed(() => (isSmall.value ? !overlayOpen.value : userCollapsed.value))

  const toggle = () => {
    if (isSmall.value) overlayOpen.value = !overlayOpen.value
    else userCollapsed.value = !userCollapsed.value
  }
  const closeOverlay = () => { overlayOpen.value = false }

  return { collapsed, isSmall, overlayOpen, toggle, closeOverlay }
}
```

### Small-screen behavior

Below 1024px the sidebar is always an icon rail. The toggle opens the full sidebar **on top of** the content (an overlay with a scrim) instead of pushing it, because a 240px push would leave a phone with almost no content width. Close the overlay on scrim click, on `Escape`, and after navigating (`watch(() => route.path, closeOverlay)`). The rail keeps its 64px slot in the layout, so the content never jumps when the overlay opens.

```css
@media (max-width: 1023px) {
  .app-shell { padding-left: var(--sidebar-width-collapsed); }  /* reserve the rail's slot */
  .sidebar { position: fixed; left: 0; top: 0; }  /* keeps z-index 100 from the base rule */
  .sidebar:not(.is-collapsed) { box-shadow: var(--shadow-md); }
  /* Just under the sidebar, but above every sticky bar in the content (grep the app for z-index). */
  .sidebar-scrim { position: fixed; inset: 0; z-index: 95; background: rgba(15, 23, 42, 0.3); }
}
```

The breakpoint lives in three places: `SMALL_QUERY` in the composable, the shell's media query (`.app-shell` padding and `.sidebar-scrim`), and any sidebar-scoped media query. Change them together.

Wire Escape and close-on-navigate in `AppSidebar`'s setup, not only in prose:

```js
import { watch, onMounted, onBeforeUnmount } from 'vue'

const { collapsed, toggle, closeOverlay } = useSidebar()
watch(() => route.path, closeOverlay)  // picking a page from the overlay should reveal that page
const onKey = (e) => { if (e.key === 'Escape') closeOverlay() }
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
```

```vue
<!-- in the shell, next to AppSidebar -->
<div v-if="isSmall && overlayOpen" class="sidebar-scrim" @click="closeOverlay" />
```

## `components/AppSidebar.vue`

```vue
<template>
  <aside class="sidebar" :class="{ 'is-collapsed': collapsed }" aria-label="Main navigation">
    <div class="sidebar__brand">
      <div class="sidebar__logo" aria-hidden="true">{{ brandInitial }}</div>
      <div v-if="!collapsed" class="sidebar__brand-text">
        <span class="sidebar__name">{{ brandName }}</span>
        <span class="sidebar__tagline">{{ brandTagline }}</span>
      </div>
    </div>

    <nav class="sidebar__nav">
      <router-link
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="sidebar__item"
        :class="{ 'is-active': isActive(item) }"
        :title="collapsed ? item.label : undefined"
        :aria-label="collapsed ? item.label : undefined"
      >
        <svg class="sidebar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
             v-html="icons[item.icon]" />
        <span v-if="!collapsed" class="sidebar__label">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar__footer">
      <!-- Reuse the app's existing components; only their placement and popover direction change. -->
      <slot name="footer" :collapsed="collapsed" />
      <button
        type="button"
        class="sidebar__toggle"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="toggle"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
             :style="{ transform: collapsed ? 'rotate(180deg)' : 'none' }">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        <span v-if="!collapsed">Collapse</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'

const props = defineProps({
  items: { type: Array, required: true }, // [{ to, label, icon }]
  brandName: { type: String, required: true },
  brandTagline: { type: String, default: '' }
})

const route = useRoute()
const { collapsed, toggle } = useSidebar()
const brandInitial = props.brandName.charAt(0)

// '/' would otherwise match every route as a prefix, so the root item needs an exact match.
const isActive = (item) =>
  item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)

// Inner SVG markup for 24x24 stroke icons. Static strings only, never user data, so v-html is safe here.
const icons = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  inventory: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  orders: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h8M9 17h5"/>',
  finance: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  forecast: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/>',
  reports: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'
}
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-fast);
  /* No overflow:hidden here: it would clip the footer popovers. Only the nav list scrolls.
     The z-index must beat every sticky bar in the content column (check the app's values) so popovers overlap it. */
  z-index: 100;
}
.sidebar.is-collapsed { width: var(--sidebar-width-collapsed); }

.sidebar__brand {
  display: flex; align-items: center; gap: var(--space-3);
  height: 64px; padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.sidebar__logo {
  flex: none; width: 32px; height: 32px; border-radius: var(--radius-md);
  display: grid; place-items: center;
  background: var(--color-accent); color: #fff; font-weight: var(--weight-semibold);
}
.sidebar__brand-text { display: flex; flex-direction: column; min-width: 0; }
.sidebar__name { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar__tagline { font-size: var(--text-xs); color: var(--color-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.sidebar__nav { flex: 1; overflow-y: auto; padding: var(--space-3); display: flex; flex-direction: column; gap: 2px; }
.sidebar__item {
  display: flex; align-items: center; gap: var(--space-3);
  height: 36px; padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted); text-decoration: none;
  font-size: var(--text-base); font-weight: var(--weight-medium);
}
.sidebar__item:hover { background: var(--color-surface-muted); color: var(--color-text); }
.sidebar__item.is-active { background: var(--color-accent-soft); color: var(--color-accent); }
.sidebar__item:focus-visible, .sidebar__toggle:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.is-collapsed .sidebar__item { justify-content: center; padding: 0; }
.sidebar__icon { flex: none; width: 20px; height: 20px; }
.sidebar__label { white-space: nowrap; }

.sidebar__footer { border-top: 1px solid var(--color-border); padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2); }
.sidebar__toggle {
  display: flex; align-items: center; gap: var(--space-3);
  height: 32px; padding: 0 var(--space-3);
  border: 0; border-radius: var(--radius-md); background: transparent;
  color: var(--color-text-muted); font: inherit; font-size: var(--text-sm); cursor: pointer;
}
.sidebar__toggle:hover { background: var(--color-surface-muted); color: var(--color-text); }
.sidebar__toggle svg { width: 18px; height: 18px; transition: transform var(--transition-fast); }
.is-collapsed .sidebar__toggle { justify-content: center; padding: 0; }
</style>
```

## Shell in `App.vue`

```vue
<div class="app-shell">
  <AppSidebar :items="navItems" :brand-name="t('nav.companyName')" :brand-tagline="t('nav.subtitle')">
    <template #footer="{ collapsed }">
      <LanguageSwitcher :compact="collapsed" />
      <ProfileMenu :compact="collapsed" placement="top" @show-profile-details="…" @show-tasks="…" />
    </template>
  </AppSidebar>
  <div class="app-main">
    <FilterBar />            <!-- any existing global bar stays above the page -->
    <main class="page"><router-view /></main>
  </div>
</div>
```

```css
.app-shell { display: flex; min-height: 100vh; background: var(--color-bg); }
.app-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }  /* min-width:0 stops wide tables from pushing past the viewport */
.page { width: 100%; max-width: var(--content-max-width); margin: 0 auto; padding: var(--page-padding); }
@media (max-width: 768px) { .page { padding: var(--space-4); } }
```

Make `navItems` a `computed` when labels come from i18n, so that switching language updates them.

Components like `ProfileMenu` probably don't accept these props yet. A shape that works well: `variant: 'topbar' | 'sidebar'` (the sidebar look is full-width and borderless) plus `compact: Boolean` for the rail, with the popover direction derived from them. Expanded opens upward, and compact opens to the right of the rail. Default `variant` to the old look so nothing else breaks.

## Consistent vertical rhythm

Give each view's content root `class="page-stack"`, and remove `margin-bottom` from the cards inside it, so one token controls the space between every section:

```css
.page-stack { display: flex; flex-direction: column; gap: var(--space-6); }
```
