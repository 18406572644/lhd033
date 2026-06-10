<script setup lang="ts">
import { watch } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

watch(
  () => themeStore.theme,
  (t) => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(t)
    localStorage.setItem('film-lab-theme', t)
  }
)
</script>

<template>
  <button
    class="theme-toggle"
    :aria-label="themeStore.isDark ? '切换到亮色模式' : '切换到暗色模式'"
    @click="themeStore.toggleTheme()"
  >
    <span class="toggle-track">
      <Transition name="icon-spin" mode="out-in">
        <Sun v-if="!themeStore.isDark" :size="18" class="toggle-icon" />
        <Moon v-else :size="18" class="toggle-icon" />
      </Transition>
    </span>
  </button>
</template>

<style scoped>
.theme-toggle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.theme-toggle:hover {
  border-color: var(--accent);
  box-shadow: 0 0 16px rgba(212, 168, 83, 0.35);
  transform: scale(1.05);
}

.toggle-track {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(212, 168, 83, 0.2), rgba(196, 149, 106, 0.15));
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.theme-toggle:hover .toggle-track {
  background: linear-gradient(135deg, rgba(212, 168, 83, 0.35), rgba(196, 149, 106, 0.25));
  box-shadow: 0 0 12px rgba(212, 168, 83, 0.25);
}

.toggle-icon {
  color: var(--accent);
  transition: color 0.3s ease;
}

.icon-spin-enter-active,
.icon-spin-leave-active {
  transition: all 0.3s ease;
}

.icon-spin-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.6);
}

.icon-spin-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.6);
}
</style>
