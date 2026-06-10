<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { fetchPresets } from '@/api/presets'
import type { FilmPreset } from '@/types'

const editorStore = useEditorStore()
const presets = ref<FilmPreset[]>([])

onMounted(async () => {
  presets.value = await fetchPresets()
})

function selectPreset(preset: FilmPreset) {
  editorStore.applyPreset(preset.id, preset.params)
}
</script>

<template>
  <div class="preset-panel">
    <div class="preset-header">
      <span class="preset-title">胶卷滤镜</span>
      <span class="preset-count">{{ presets.length }} 款预设</span>
    </div>
    <div class="preset-scroll">
      <div
        v-for="preset in presets"
        :key="preset.id"
        class="preset-item"
        :class="{ 'preset-item--active': editorStore.activePresetId === preset.id }"
        @click="selectPreset(preset)"
      >
        <div class="preset-thumb">
          <img
            :src="preset.thumbnail"
            :alt="preset.name"
            class="preset-thumb-img"
            loading="lazy"
          />
          <div v-if="editorStore.activePresetId === preset.id" class="preset-check">
            ✓
          </div>
        </div>
        <div class="preset-info">
          <span class="preset-name">{{ preset.name }}</span>
          <span class="preset-brand">{{ preset.brand }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preset-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.preset-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.preset-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.preset-count {
  font-size: 0.7rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 2px 8px;
  border-radius: 9999px;
}

.preset-scroll {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.preset-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.preset-item:hover {
  transform: translateY(-2px);
}

.preset-thumb {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border-color);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.preset-item--active .preset-thumb {
  border-color: var(--accent);
  box-shadow: 0 0 16px rgba(212, 168, 83, 0.4);
}

.preset-thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preset-check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(212, 168, 83, 0.5);
  color: #1A1614;
  font-size: 1.2rem;
  font-weight: 700;
}

.preset-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.preset-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.preset-brand {
  font-size: 0.6rem;
  color: var(--text-secondary);
}

.preset-item--active .preset-name {
  color: var(--accent);
}
</style>
