import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('light')

  const isDark = computed(() => theme.value === 'dark')

  function getPreferredTheme(): Theme {
    const saved = localStorage.getItem('film-lab-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  function applyTheme(t: Theme) {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    localStorage.setItem('film-lab-theme', t)
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function init() {
    theme.value = getPreferredTheme()
    applyTheme(theme.value)
  }

  return { theme, isDark, toggleTheme, init }
})
