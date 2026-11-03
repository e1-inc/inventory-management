<template>
  <aside
    class="sidebar"
    :class="{ 'is-collapsed': collapsed, 'is-overlay': isSmall && !collapsed }"
    :aria-label="t('nav.mainNavigation')"
  >
    <div class="sidebar__brand">
      <div class="sidebar__logo" aria-hidden="true">{{ brandInitial }}</div>
      <div v-if="!collapsed" class="sidebar__brand-text">
        <span class="sidebar__name">{{ brandName }}</span>
        <span v-if="brandTagline" class="sidebar__tagline">{{ brandTagline }}</span>
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
        <svg
          class="sidebar__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          v-html="icons[item.icon]"
        />
        <span v-if="!collapsed" class="sidebar__label">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar__footer">
      <!-- The app's existing controls (language, profile) are passed in; only their placement changes. -->
      <slot name="footer" :collapsed="collapsed" />
      <button
        type="button"
        class="sidebar__toggle"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        :title="collapsed ? t('nav.expandSidebar') : undefined"
        @click="toggle"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          :class="{ 'is-flipped': collapsed }"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
          <path d="M16 10l-2 2 2 2" />
        </svg>
        <span v-if="!collapsed">{{ t('nav.collapse') }}</span>
      </button>
    </div>
  </aside>
</template>

<script>
import { computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useSidebar } from '../composables/useSidebar'
import { useI18n } from '../composables/useI18n'

// Inner markup for 24x24 stroke icons. Static strings only, never user data, so v-html is safe here.
const icons = {
  overview: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  inventory: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  orders: '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h8M9 17h5"/>',
  finance: '<path d="M12 2v20"/><path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  forecast: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/>',
  reports: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
}

export default {
  name: 'AppSidebar',
  props: {
    // [{ to, label, icon }] where icon is a key of the icons map above
    items: { type: Array, required: true },
    brandName: { type: String, required: true },
    brandTagline: { type: String, default: '' }
  },
  setup(props) {
    const route = useRoute()
    const { collapsed, isSmall, overlayOpen, toggle, closeOverlay } = useSidebar()
    const { t } = useI18n()

    // On small screens the expanded sidebar is a temporary overlay: close it after navigating
    // and on Escape so it never stays over the page the user just opened.
    watch(() => route.path, closeOverlay)
    const onKeydown = (e) => {
      if (e.key === 'Escape' && isSmall.value && overlayOpen.value) closeOverlay()
    }
    onMounted(() => window.addEventListener('keydown', onKeydown))
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

    // Computed because the brand name is translated and changes with the locale.
    const brandInitial = computed(() => props.brandName.charAt(0))

    // '/' would otherwise match every route as a prefix, so the root item needs an exact match.
    const isActive = (item) =>
      item.to === '/' ? route.path === '/' : route.path.startsWith(item.to)

    return { collapsed, isSmall, toggle, t, brandInitial, isActive, icons }
  }
}
</script>

<style scoped>
.sidebar {
  position: sticky;
  top: 0;
  /* Above the sticky FilterBar (z-index 90) so footer popovers can overlap the content column. */
  z-index: 100;
  flex: none;
  height: 100vh;
  width: var(--sidebar-width);
  display: flex;
  flex-direction: column;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  transition: width var(--transition-fast);
  /* No overflow:hidden here: it would clip the profile and language popovers. The nav scrolls on its own. */
}

.sidebar.is-collapsed {
  width: var(--sidebar-width-collapsed);
}

.sidebar__brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--topbar-height);
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex: none;
  overflow: hidden;
}

.sidebar__logo {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  background: var(--color-text);
  color: #fff;
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
}

.sidebar__brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: var(--leading-tight);
}

.sidebar__name {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__tagline {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar__item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--control-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--text-base);
  font-weight: var(--weight-medium);
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sidebar__item:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.sidebar__item.is-active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.sidebar__item:focus-visible,
.sidebar__toggle:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.is-collapsed .sidebar__item {
  justify-content: center;
  padding: 0;
}

.sidebar__icon {
  flex: none;
  width: 20px;
  height: 20px;
}

.sidebar__label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar__footer {
  flex: none;
  border-top: 1px solid var(--color-border);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.sidebar__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  height: var(--control-height);
  padding: 0 var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sidebar__toggle:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.sidebar__toggle svg {
  flex: none;
  width: 20px;
  height: 20px;
  transition: transform var(--transition-fast);
}

.sidebar__toggle svg.is-flipped {
  transform: scaleX(-1);
}

.is-collapsed .sidebar__toggle {
  justify-content: center;
  padding: 0;
}

/* Below 1024px the sidebar leaves the flow: the shell reserves the rail's 64px slot
   (see .app-shell in App.vue), and expanding draws the full sidebar over the content
   instead of pushing it, so the page never jumps or shrinks. */
@media (max-width: 1023px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
  }

  .sidebar.is-overlay {
    box-shadow: var(--shadow-md);
  }
}
</style>
