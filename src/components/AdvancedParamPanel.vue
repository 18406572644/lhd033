<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import type { FilterParams, RGBCurves } from '@/types'
import { DEFAULT_PARAMS } from '@/api/mock'
import RGBCurveEditorComp from './RGBCurveEditor.vue'
import {
  ChevronDown,
  Moon as MoonIcon,
  Sun as SunIcon,
  Focus as FocusIcon,
  CircleDot as CircleDotIcon,
  Palette as PaletteIcon,
  RotateCcw,
} from 'lucide-vue-next'

const editorStore = useEditorStore()
const isExpanded = ref(false)

interface AdvancedParamConfig {
  key: keyof FilterParams
  label: string
  min: number
  max: number
  step: number
  icon: any
  unit: string
  defaultValue: number
}

const sliderParams: AdvancedParamConfig[] = [
  { key: 'shadows', label: '阴影', min: -100, max: 100, step: 1, icon: MoonIcon, unit: '', defaultValue: 0 },
  { key: 'highlights', label: '高光', min: -100, max: 100, step: 1, icon: SunIcon, unit: '', defaultValue: 0 },
  { key: 'clarity', label: '清晰度', min: -100, max: 100, step: 1, icon: FocusIcon, unit: '', defaultValue: 0 },
  { key: 'vignette', label: '暗角', min: 0, max: 100, step: 1, icon: CircleDotIcon, unit: '', defaultValue: 0 },
]

const splitToneParams: AdvancedParamConfig[] = [
  { key: 'splitToneShadowHue', label: '阴影色相', min: 0, max: 360, step: 1, icon: PaletteIcon, unit: '°', defaultValue: 0 },
  { key: 'splitToneShadowSat', label: '阴影饱和度', min: 0, max: 100, step: 1, icon: PaletteIcon, unit: '%', defaultValue: 0 },
  { key: 'splitToneHighlightHue', label: '高光色相', min: 0, max: 360, step: 1, icon: PaletteIcon, unit: '°', defaultValue: 0 },
  { key: 'splitToneHighlightSat', label: '高光饱和度', min: 0, max: 100, step: 1, icon: PaletteIcon, unit: '%', defaultValue: 0 },
]

function getSliderBackground(key: keyof FilterParams, value: number, config: AdvancedParamConfig) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100
  return `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-secondary) ${pct}%, var(--bg-secondary) 100%)`
}

function isDefault(key: keyof FilterParams) {
  const val = editorStore.params[key]
  const def = DEFAULT_PARAMS[key]
  if (typeof val === 'number' && typeof def === 'number') return val === def
  return JSON.stringify(val) === JSON.stringify(def)
}

function resetParam(key: keyof FilterParams) {
  editorStore.commitParamChange(key, DEFAULT_PARAMS[key] as any)
}

function onParamInput(key: keyof FilterParams, value: number) {
  editorStore.updateParam(key, value as any)
}

function onParamChange(key: keyof FilterParams, value: number) {
  editorStore.commitParamChange(key, value as any)
}

function onCurveInput(curves: RGBCurves) {
  editorStore.updateParam('rgbCurves', curves)
}

function onCurveChange() {
  editorStore.commitParamChange('rgbCurves', editorStore.params.rgbCurves)
}

const hasAdvancedChanges = computed(() => {
  const p = editorStore.params
  return p.shadows !== 0 || p.highlights !== 0 || p.clarity !== 0 || p.vignette !== 0 ||
    p.splitToneShadowSat !== 0 || p.splitToneHighlightSat !== 0 ||
    JSON.stringify(p.rgbCurves) !== JSON.stringify(DEFAULT_PARAMS.rgbCurves)
})

function onResetAdvanced() {
  editorStore.resetAdvancedParams()
}

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="advanced-panel">
    <div class="advanced-header" @click="toggleExpanded">
      <div class="advanced-header-left">
        <span class="advanced-title">高级参数</span>
        <span v-if="hasAdvancedChanges" class="advanced-badge">已调整</span>
      </div>
      <div class="advanced-header-right">
        <button
          v-if="hasAdvancedChanges"
          class="advanced-reset-btn"
          @click.stop="onResetAdvanced"
          title="重置高级参数"
        >
          <RotateCcw :size="12" />
        </button>
        <ChevronDown :size="16" class="advanced-chevron" :class="{ 'advanced-chevron--open': isExpanded }" />
      </div>
    </div>

    <Transition name="slide">
      <div v-if="isExpanded" class="advanced-body">
        <div class="advanced-section">
          <div class="advanced-section-title">光影调节</div>
          <div class="advanced-param-list">
            <div
              v-for="config in sliderParams"
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
                  <span class="param-number">{{ editorStore.params[config.key] as number }}</span>
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
                :value="editorStore.params[config.key] as number"
                class="param-slider"
                :style="{ background: getSliderBackground(config.key, editorStore.params[config.key] as number, config) }"
                @input="(e: Event) => onParamInput(config.key, Number((e.target as HTMLInputElement).value))"
                @change="(e: Event) => onParamChange(config.key, Number((e.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </div>

        <div class="advanced-section">
          <div class="advanced-section-title">色调分离</div>
          <div class="advanced-param-list">
            <div
              v-for="config in splitToneParams"
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
                  <span class="param-number">{{ editorStore.params[config.key] as number }}</span>
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
                :value="editorStore.params[config.key] as number"
                class="param-slider"
                :style="{ background: getSliderBackground(config.key, editorStore.params[config.key] as number, config) }"
                @input="(e: Event) => onParamInput(config.key, Number((e.target as HTMLInputElement).value))"
                @change="(e: Event) => onParamChange(config.key, Number((e.target as HTMLInputElement).value))"
              />
            </div>
          </div>
        </div>

        <div class="advanced-section">
          <div class="advanced-section-title">RGB 曲线</div>
          <RGBCurveEditorComp
            :model-value="editorStore.params.rgbCurves"
            @update:model-value="onCurveInput"
            @change="onCurveChange"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.advanced-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.advanced-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s ease;
  user-select: none;
}

.advanced-header:hover {
  background: var(--bg-secondary);
}

.advanced-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.advanced-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.advanced-badge {
  font-size: 0.6rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 9999px;
  background: rgba(212, 168, 83, 0.15);
  color: var(--accent);
  border: 1px solid rgba(212, 168, 83, 0.3);
}

.advanced-header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.advanced-reset-btn {
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

.advanced-reset-btn:hover {
  color: var(--accent);
  background: var(--bg-secondary);
}

.advanced-chevron {
  color: var(--text-secondary);
  transition: transform 0.3s ease;
}

.advanced-chevron--open {
  transform: rotate(180deg);
}

.advanced-body {
  border-top: 1px solid var(--border-color);
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.advanced-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.advanced-section-title {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.advanced-param-list {
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

.param-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.param-slider::-webkit-slider-thumb {
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

.param-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 800px;
}
</style>
