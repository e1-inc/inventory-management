<template>
  <div class="app-shell">
    <AppSidebar
      :items="navItems"
      :brand-name="t('nav.companyName')"
      :brand-tagline="t('nav.subtitle')"
    >
      <template #footer="{ collapsed }">
        <LanguageSwitcher variant="sidebar" :compact="collapsed" />
        <ProfileMenu
          variant="sidebar"
          :compact="collapsed"
          @show-profile-details="showProfileDetails = true"
          @show-tasks="showTasks = true"
        />
      </template>
    </AppSidebar>

    <!-- Small screens only: dims the page while the full sidebar is open over it. -->
    <div
      v-if="isSmall && overlayOpen"
      class="sidebar-scrim"
      aria-hidden="true"
      @click="closeOverlay"
    ></div>

    <div class="app-main">
      <FilterBar />
      <main class="page">
        <router-view />
      </main>
    </div>

    <ProfileDetailsModal
      :is-open="showProfileDetails"
      @close="showProfileDetails = false"
    />

    <TasksModal
      :is-open="showTasks"
      :tasks="tasks"
      @close="showTasks = false"
      @add-task="addTask"
      @delete-task="deleteTask"
      @toggle-task="toggleTask"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { api } from './api'
import { useAuth } from './composables/useAuth'
import { useI18n } from './composables/useI18n'
import { useSidebar } from './composables/useSidebar'
import AppSidebar from './components/AppSidebar.vue'
import FilterBar from './components/FilterBar.vue'
import ProfileMenu from './components/ProfileMenu.vue'
import ProfileDetailsModal from './components/ProfileDetailsModal.vue'
import TasksModal from './components/TasksModal.vue'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

export default {
  name: 'App',
  components: {
    AppSidebar,
    FilterBar,
    ProfileMenu,
    ProfileDetailsModal,
    TasksModal,
    LanguageSwitcher
  },
  setup() {
    const { currentUser } = useAuth()
    const { t } = useI18n()
    const { isSmall, overlayOpen, closeOverlay } = useSidebar()
    const showProfileDetails = ref(false)
    const showTasks = ref(false)
    const apiTasks = ref([])

    // Single source for the sidebar links. Computed so labels follow the active locale.
    // Adding a page means adding one entry here (icon keys live in AppSidebar.vue).
    const navItems = computed(() => [
      { to: '/', label: t('nav.overview'), icon: 'overview' },
      { to: '/inventory', label: t('nav.inventory'), icon: 'inventory' },
      { to: '/orders', label: t('nav.orders'), icon: 'orders' },
      { to: '/spending', label: t('nav.finance'), icon: 'finance' },
      { to: '/demand', label: t('nav.demandForecast'), icon: 'forecast' },
      { to: '/reports', label: t('nav.reports'), icon: 'reports' }
    ])

    // Merge mock tasks from currentUser with API tasks
    const tasks = computed(() => {
      return [...currentUser.value.tasks, ...apiTasks.value]
    })

    const loadTasks = async () => {
      try {
        apiTasks.value = await api.getTasks()
      } catch (err) {
        console.error('Failed to load tasks:', err)
      }
    }

    const addTask = async (taskData) => {
      try {
        const newTask = await api.createTask(taskData)
        // Add new task to the beginning of the array
        apiTasks.value.unshift(newTask)
      } catch (err) {
        console.error('Failed to add task:', err)
      }
    }

    const deleteTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const isMockTask = currentUser.value.tasks.some(t => t.id === taskId)

        if (isMockTask) {
          // Remove from mock tasks
          const index = currentUser.value.tasks.findIndex(t => t.id === taskId)
          if (index !== -1) {
            currentUser.value.tasks.splice(index, 1)
          }
        } else {
          // Remove from API tasks
          await api.deleteTask(taskId)
          apiTasks.value = apiTasks.value.filter(t => t.id !== taskId)
        }
      } catch (err) {
        console.error('Failed to delete task:', err)
      }
    }

    const toggleTask = async (taskId) => {
      try {
        // Check if it's a mock task (from currentUser)
        const mockTask = currentUser.value.tasks.find(t => t.id === taskId)

        if (mockTask) {
          // Toggle mock task status
          mockTask.status = mockTask.status === 'pending' ? 'completed' : 'pending'
        } else {
          // Toggle API task
          const updatedTask = await api.toggleTask(taskId)
          const index = apiTasks.value.findIndex(t => t.id === taskId)
          if (index !== -1) {
            apiTasks.value[index] = updatedTask
          }
        }
      } catch (err) {
        console.error('Failed to toggle task:', err)
      }
    }

    onMounted(loadTasks)

    return {
      t,
      navItems,
      isSmall,
      overlayOpen,
      closeOverlay,
      showProfileDetails,
      showTasks,
      tasks,
      addTask,
      deleteTask,
      toggleTask
    }
  }
}
</script>

<style>
/* ==========================================================================
   Design tokens
   One spacing/type/color scale that every view and component draws from.
   Colors keep the existing slate + #2563eb palette.
   ========================================================================== */
:root {
  /* Spacing: 4px base */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Noto Sans JP', sans-serif;
  --text-xs: 12px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-md: 16px;
  --text-lg: 20px;
  --text-xl: 24px;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --leading-tight: 1.25;
  --leading-normal: 1.5;

  /* Neutrals (slate) */
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-text: #0f172a;
  --color-text-secondary: #334155;
  --color-text-muted: #64748b;
  --color-text-subtle: #94a3b8;

  /* Accent: active nav, primary buttons, focus */
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-soft: #eff6ff;

  /* Status: strong for text/icons, soft for pill backgrounds */
  --color-success: #047857;  --color-success-soft: #d1fae5;
  --color-warning: #b45309;  --color-warning-soft: #fef3c7;
  --color-danger: #b91c1c;   --color-danger-soft: #fee2e2;
  --color-info: #1d4ed8;     --color-info-soft: #dbeafe;

  /* Shape & depth */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
  --focus-ring: 0 0 0 3px rgba(37, 99, 235, 0.35);

  /* Layout */
  --sidebar-width: 240px;
  --sidebar-width-collapsed: 64px;
  --topbar-height: 64px;          /* sidebar brand row and filter bar share it so their borders line up */
  --content-max-width: 1440px;
  --page-padding: var(--space-8);
  --section-gap: var(--space-6);  /* the one gap between page sections and between cards */
  --control-height: 36px;
  --transition-fast: 150ms ease;
}

@media (prefers-reduced-motion: reduce) {
  :root { --transition-fast: 0ms; }
}

/* ==========================================================================
   Base
   ========================================================================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  background: var(--color-bg);
  color: var(--color-text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

button,
input,
select,
textarea {
  font-family: inherit;
}

:where(button, a, input, select, textarea, summary):focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

/* ==========================================================================
   Shell
   ========================================================================== */
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

/* min-width: 0 stops wide tables from pushing the column past the viewport */
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.page {
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--page-padding);
}

/* Below 1024px the sidebar is position: fixed (see AppSidebar.vue), so the shell reserves
   the rail's slot and the content keeps its width when the overlay opens. */
@media (max-width: 1023px) {
  .app-shell {
    padding-left: var(--sidebar-width-collapsed);
  }

  /* Between the sticky FilterBar (z-index 90) and the sidebar (z-index 100). */
  .sidebar-scrim {
    position: fixed;
    inset: 0;
    z-index: 95;
    background: rgba(15, 23, 42, 0.3);
  }
}

@media (max-width: 768px) {
  :root {
    --page-padding: var(--space-4);
  }
}

/* ==========================================================================
   Page template
   ========================================================================== */
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--section-gap);
}

.page-header h2 {
  font-size: var(--text-xl);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.015em;
  color: var(--color-text);
}

.page-header p {
  margin-top: var(--space-1);
  font-size: var(--text-base);
  color: var(--color-text-muted);
}

/* Vertical rhythm for a page's content: every direct child is one section. */
.page-stack {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

.page-stack > * {
  min-width: 0;
}

.section-title {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-3);
}

/* ==========================================================================
   Stat / KPI cards
   ========================================================================== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.stat-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
}

.stat-label {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.stat-value {
  font-size: 28px;
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  letter-spacing: -0.02em;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

/* Status stat cards get a small colored dot by the label instead of a colored figure. */
.stat-card:is(.success, .warning, .danger, .info) .stat-label::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  flex: none;
}

.stat-card.success .stat-label::before { background: var(--color-success); }
.stat-card.warning .stat-label::before { background: var(--color-warning); }
.stat-card.danger .stat-label::before { background: var(--color-danger); }
.stat-card.info .stat-label::before { background: var(--color-info); }

/* ==========================================================================
   Cards
   ========================================================================== */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6);
  min-width: 0;
}

.card-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}

.card-title {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-tight);
  color: var(--color-text);
}

/* ==========================================================================
   Tables
   ========================================================================== */
.table-container {
  overflow-x: auto;
}

/* A table that is a card's last block runs edge to edge, so rows span the full card width. */
.card > .table-container:last-child {
  margin: 0 calc(-1 * var(--space-6)) calc(-1 * var(--space-6));
  border-bottom-left-radius: var(--radius-lg);
  border-bottom-right-radius: var(--radius-lg);
}

.card > .table-container:last-child :is(th, td):first-child {
  padding-left: var(--space-6);
}

.card > .table-container:last-child :is(th, td):last-child {
  padding-right: var(--space-6);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}

thead {
  background: var(--color-surface-muted);
}

th {
  text-align: left;
  padding: var(--space-2) var(--space-4);
  height: 36px;
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

td {
  padding: var(--space-3) var(--space-4);
  height: 44px;
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-surface-muted);
}

tbody tr:last-child td {
  border-bottom: 0;
}

td strong {
  font-weight: var(--weight-medium);
  color: var(--color-text);
}

tbody tr {
  transition: background-color var(--transition-fast);
}

tbody tr:hover {
  background: var(--color-bg);
}

/* Numeric columns: right-aligned so digits line up. */
th.num,
td.num {
  text-align: right;
}

.clickable-row {
  cursor: pointer;
}

/* ==========================================================================
   Badges
   ========================================================================== */
.badge {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}

.badge.success,
.badge.increasing {
  background: var(--color-success-soft);
  color: var(--color-success);
}

.badge.warning,
.badge.medium {
  background: var(--color-warning-soft);
  color: var(--color-warning);
}

.badge.danger,
.badge.decreasing,
.badge.high {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.badge.info,
.badge.low {
  background: var(--color-info-soft);
  color: var(--color-info);
}

/* "Stable" carries no good/bad meaning, so it stays neutral (the base .badge colors). */

/* ==========================================================================
   Buttons and inputs
   ========================================================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  height: var(--control-height);
  padding: 0 var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
}

.btn-sm {
  height: 28px;
  padding: 0 var(--space-3);
}

.btn-primary {
  background: var(--color-accent);
  color: #fff;
}

.btn-primary:hover {
  background: var(--color-accent-hover);
}

.btn-secondary {
  background: var(--color-surface);
  border-color: var(--color-border-strong);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}

.input,
.select {
  height: var(--control-height);
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--text-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

.input:hover,
.select:hover {
  border-color: var(--color-text-subtle);
}

.input:focus-visible,
.select:focus-visible {
  border-color: var(--color-accent);
}

/* ==========================================================================
   States
   ========================================================================== */
.loading {
  text-align: center;
  padding: var(--space-12);
  color: var(--color-text-muted);
}

.error {
  background: var(--color-danger-soft);
  border: 1px solid #fecaca;
  color: var(--color-danger);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
</style>
