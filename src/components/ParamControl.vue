<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { FilterParams } from '@/types'
import { DEFAULT_PARAMS } from '@/api/mock'
import {
  Sun,
  Contrast,
  Thermometer,
  Sparkles,
  Dices,
  Settings,
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

const randomRange = ref(30)
const showRangeSlider = ref(false)
const isRolling = ref(false)

function getSliderBackground(key: keyof FilterParams, value: number, config: ParamConfig) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100
  return `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-secondary) ${pct}%, var(--bg-secondary) 100%)`
}

function isDefault(key: keyof FilterParams) {
  return editorStore.params[key] === DEFAULT_PARAMS[key]
}

function resetParam(key: keyof FilterParams) {
  editorStore.commitParamChange(key, DEFAULT_PARAMS[key])
}

function onParamInput(key: keyof FilterParams, value: number) {
  editorStore.updateParam(key, value)
}

function onParamChange(key: keyof FilterParams, value: number) {
  editorStore.commitParamChange(key, value)
}

const hasChanges = computed(() => {
  return paramConfigs.some(c => editorStore.params[c.key] !== c.defaultValue)
})

function onRandomize() {
  if (!editorStore.hasImage) return
  isRolling.value = true
  editorStore.randomizeParams(randomRange.value)
  setTimeout(() => {
    isRolling.value = false
  }, 300)
}

function toggleRangeSlider() {
  showRangeSlider.value = !showRangeSlider.value
}
</script>

<template>
  <div class="param-panel">
    <div class="param-header">
      <span class="param-title">参数调节</span>
      <div class="param-header-actions">
        <button
          class="dice-btn"
          :class="{ 'dice-btn--rolling': isRolling, 'dice-btn--disabled': !editorStore.hasImage }"
          :disabled="!editorStore.hasImage"
          @click="onRandomize"
          title="随机调色"
        >
          <Dices :size="16" :class="{ 'dice-icon': isRolling }" />
        </button>
        <button
          class="range-setting-btn"
          :class="{ 'range-setting-btn--active': showRangeSlider }"
          @click="toggleRangeSlider"
          title="设置随机范围"
        >
          <Settings :size="14" />
        </button>
        <button
          v-if="hasChanges"
          class="param-reset"
          @click="editorStore.resetParams()"
        >
          全部重置
        </button>
      </div>
    </div>

    <div v-if="showRangeSlider" class="random-range-panel">
      <div class="range-label">
        <span>随机范围</span>
        <span class="range-value">{{ randomRange }}%</span>
      </div>
      <input
        type="range"
        min="5"
        max="100"
        step="5"
        v-model.number="randomRange"
        class="range-slider"
      />
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
          :style="{ background: getSliderBackground(config.key, editorStore.params[config.key] as number, config) }"
          @input="(e: Event) => onParamInput(config.key, Number((e.target as HTMLInputElement).value))"
          @change="(e: Event) => onParamChange(config.key, Number((e.target as HTMLInputElement).value))"
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

.param-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.dice-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(212, 168, 83, 0.1);
  border: 1px solid rgba(212, 168, 83, 0.3);
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dice-btn:hover:not(:disabled) {
  background: var(--accent);
  color: #1A1614;
  transform: scale(1.05);
}

.dice-btn--rolling .dice-icon {
  animation: dice-roll 0.3s ease-in-out;
}

@keyframes dice-roll {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.2); }
  100% { transform: rotate(360deg) scale(1); }
}

.dice-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.range-setting-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.range-setting-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.range-setting-btn--active {
  color: var(--accent);
}

.random-range-panel {
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.range-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.range-value {
  font-weight: 600;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.range-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--bg-card);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.range-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
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
