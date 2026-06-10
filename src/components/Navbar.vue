<script setup lang="ts">
import { Camera } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

const route = useRoute()
</script>

<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <router-link to="/" class="brand">
        <Camera :size="28" class="brand-icon" />
        <div class="brand-text">
          <span class="brand-name">FilmLab</span>
          <span class="brand-subtitle">胶卷调色实验室</span>
        </div>
      </router-link>

      <div class="nav-links">
        <router-link
          to="/"
          class="nav-link"
          :class="{ active: route.path === '/' }"
        >
          编辑器
        </router-link>
        <router-link
          to="/gallery"
          class="nav-link"
          :class="{ active: route.path === '/gallery' }"
        >
          案例库
        </router-link>
        <router-link
          to="/print-layout"
          class="nav-link"
          :class="{ active: route.path === '/print-layout' }"
        >
          <LayoutGrid :size="14" class="inline-block mr-1" />
          打印排版
        </router-link>
      </div>

      <div class="nav-actions">
        <ThemeToggle />
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(250, 240, 230, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 12px var(--shadow);
  transition: background 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
}

:deep(.dark) .navbar,
.dark .navbar {
  background: rgba(26, 22, 20, 0.8);
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-primary);
  transition: opacity 0.3s ease;
}

.brand:hover {
  opacity: 0.85;
}

.brand-icon {
  color: var(--accent);
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.brand:hover .brand-icon {
  transform: rotate(-8deg) scale(1.05);
}

.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.brand-name {
  font-family: 'Playfair Display', serif;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text-primary);
}

.brand-subtitle {
  font-size: 0.7rem;
  font-style: italic;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  position: relative;
  padding: 6px 18px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 8px;
  transition: color 0.3s ease, background 0.3s ease;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.nav-link.active {
  color: var(--accent);
  font-weight: 600;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 18px;
  right: 18px;
  height: 2px;
  background: var(--accent);
  border-radius: 1px;
  animation: underline-in 0.25s ease forwards;
}

@keyframes underline-in {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
