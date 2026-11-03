<template>
  <div :class="['language-switcher', `language-switcher--${variant}`, { 'is-compact': compact }]">
    <button
      type="button"
      class="language-button"
      aria-haspopup="listbox"
      :aria-expanded="isDropdownOpen"
      :aria-label="compact ? localeName : undefined"
      :title="compact ? localeName : undefined"
      @click="toggleDropdown"
      @blur="handleBlur"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        class="globe-icon"
      >
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M3 10H17" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 3C10 3 7.5 5.5 7.5 10C7.5 14.5 10 17 10 17" stroke="currentColor" stroke-width="1.5"/>
        <path d="M10 3C10 3 12.5 5.5 12.5 10C12.5 14.5 10 17 10 17" stroke="currentColor" stroke-width="1.5"/>
      </svg>
      <span v-if="!compact" class="language-label">{{ localeName }}</span>
      <svg
        v-if="!compact"
        class="chevron"
        :class="{ 'chevron-open': isDropdownOpen }"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>

    <div v-if="isDropdownOpen" class="dropdown-menu">
      <button
        v-for="locale in availableLocales"
        :key="locale"
        class="dropdown-item"
        :class="{ active: currentLocale === locale }"
        @mousedown.prevent="selectLanguage(locale)"
      >
        <span class="language-name">{{ getLanguageName(locale) }}</span>
        <svg
          v-if="currentLocale === locale"
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          class="check-icon"
        >
          <path d="M4 9L7.5 12.5L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../composables/useI18n'

defineProps({
  // 'topbar' keeps the original look (dropdown opens downward); 'sidebar' is a full-width
  // footer control whose dropdown opens upward, or to the right when compact.
  variant: { type: String, default: 'topbar' },
  // Compact shows only the globe icon (used by the collapsed sidebar rail).
  compact: { type: Boolean, default: false }
})

const { currentLocale, setLocale, availableLocales, localeName } = useI18n()

const isDropdownOpen = ref(false)

const languageNames = {
  en: 'English',
  ja: '日本語'
}

const getLanguageName = (locale) => {
  return languageNames[locale] || locale
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const handleBlur = () => {
  // Delay to allow mousedown events on dropdown items to fire first
  setTimeout(() => {
    isDropdownOpen.value = false
  }, 200)
}

const selectLanguage = (locale) => {
  setLocale(locale)
  isDropdownOpen.value = false
}
</script>

<style scoped>
.language-switcher {
  position: relative;
}

.language-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
  font-size: 0.875rem;
  color: #334155;
}

.language-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.globe-icon {
  color: #64748b;
  flex-shrink: 0;
}

.language-label {
  font-weight: 500;
}

.chevron {
  color: #64748b;
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.chevron-open {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 160px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
}

.dropdown-item:hover {
  background: #f8fafc;
}

.dropdown-item.active {
  background: #eff6ff;
  color: #2563eb;
}

.language-name {
  flex: 1;
}

.check-icon {
  color: #2563eb;
  flex-shrink: 0;
}

/* Sidebar footer variant */
.language-switcher--sidebar .language-button {
  width: 100%;
  gap: var(--space-3);
  height: var(--control-height);
  padding: 0 var(--space-3);
  background: transparent;
  border-color: transparent;
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
}

.language-switcher--sidebar .language-button:hover {
  background: var(--color-surface-muted);
  border-color: transparent;
  color: var(--color-text);
}

.language-switcher--sidebar .language-button:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.language-switcher--sidebar .language-label {
  flex: 1;
  text-align: left;
}

/* Opens upward: the control sits at the bottom of the viewport in the sidebar footer. */
.language-switcher--sidebar .chevron {
  transform: rotate(180deg);
}

.language-switcher--sidebar .chevron-open {
  transform: rotate(0deg);
}

.language-switcher--sidebar .dropdown-menu {
  top: auto;
  right: auto;
  left: 0;
  bottom: calc(100% + var(--space-2));
  box-shadow: var(--shadow-md);
}

.language-switcher--sidebar.is-compact .language-button {
  justify-content: center;
  padding: 0;
}

/* Collapsed rail: open to the right of the rail instead. */
.language-switcher--sidebar.is-compact .dropdown-menu {
  bottom: auto;
  top: 0;
  left: calc(100% + var(--space-3));
}
</style>
