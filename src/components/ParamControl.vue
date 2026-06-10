<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { FilterParams } from '@/types'
import { DEFAULT_PARAMS } from '@/api/mock'
import {
  Sun,
  Contrast,
  Thermometer,
  Sparkles,
} from 'lucide-vue-next'

const editorStore = useEditorStore()

interface ParamConfig {
  key: keyof FilterParams
  label: string
  min: number
  max: number
  step: number
  icon: any
  unit: string
  defaultValue: number
}

const paramConfigs: ParamConfig[] = [
  { key: 'brightness', label: '亮度', min: 0, max: 200, step: 1, icon: Sun, unit: '%', defaultValue: DEFAULT_PARAMS.brightness },
  { key: 'contrast', label: '对比度', min: 0, max: 200, step: 1, icon: Contrast, unit: '%', defaultValue: DEFAULT_PARAMS.contrast },
  { key: 'temperature', label: '色温', min: -100, max: 100, step: 1, icon: Thermometer, unit: '', defaultValue: DEFAULT_PARAMS.temperature },
  { key: 'grain', label: '颗粒感', min: 0, max: 100, step: 1, icon: Sparkles, unit: '', defaultValue: DEFAULT_PARAMS.grain },
]

function getSliderBackground(key: keyof FilterParams, value: number, config: ParamConfig) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100
  return `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-secondary) ${pct}%, var(--bg-secondary) 100%)`
}

function isDefault(key: keyof FilterParams) {
  return editorStore.params[key] === DEFAULT_PARAMS[key]
}

function resetParam(key: keyof FilterParams) {
  editorStore.updateParam(key, DEFAULT_PARAMS[key])
}

const hasChanges = computed(() => {
  return paramConfigs.some(c => editorStore.params[c.key] !== c.defaultValue)
})
</script>

<template>
  <div class="param-panel">
    <div class="param-header">
      <span class="param-title">参数调节</span>
      <button
        v-if="hasChanges"
        class="param-reset"
        @click="editorStore.resetParams()"
      >
        全部重置
      </button>
    </div>

    <div class="param-list">
      <div
        v-for="config in paramConfigs"
        :key="config.key"
        class="param-item"
        :class="{ 'param-item--active': !isDefault(config.key) }"
      >
        <div class="param-row">
          <div class="param-label">
            <component :is="config.icon" :size="14" class="param-icon" />
            <span>{{ config.label }}</span>
          </div>
          <div class="param-value">
            <span class="param-number">{{ editorStore.params[config.key] }}</span>
            <span class="param-unit">{{ config.unit }}</span>
            <button
              v-if="!isDefault(config.key)"
              class="param-reset-btn"
              @click="resetParam(config.key)"
              title="重置"
            >
              ↺
            </button>
          </div>
        </div>
        <input
          type="range"
          :min="config.min"
          :max="config.max"
          :step="config.step"
          :value="editorStore.params[config.key]"
          class="param-slider"
          :style="{ background: getSliderBackground(config.key, editorStore.params[config.key], config) }"
          @input="(e: Event) => editorStore.updateParam(config.key, Number((e.target as HTMLInputElement).value))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.param-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.param-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.param-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.param-reset {
  font-size: 0.7rem;
  color: var(--accent);
  background: none;
  border: 1px solid var(--accent);
  border-radius: 9999px;
  padding: 2px 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.param-reset:hover {
  background: var(--accent);
  color: #1A1614;
}

.param-list {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.param-item {
  transition: opacity 0.2s ease;
}

.param-item--active {
  opacity: 1;
}

.param-item:not(.param-item--active) {
  opacity: 0.75;
}

.param-item:not(.param-item--active):hover {
  opacity: 1;
}

.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.param-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-primary);
}

.param-icon {
  color: var(--text-secondary);
}

.param-item--active .param-icon {
  color: var(--accent);
}

.param-value {
  display: flex;
  align-items: center;
  gap: 2px;
}

.param-number {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  min-width: 28px;
  text-align: right;
}

.param-unit {
  font-size: 0.65rem;
  color: var(--text-secondary);
  width: 12px;
}

.param-reset-btn {
  font-size: 0.75rem;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
  margin-left: 4px;
  padding: 0 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.param-item:hover .param-reset-btn {
  opacity: 1;
}

.param-reset-btn:hover {
  transform: scale(1.2);
}
</style>
