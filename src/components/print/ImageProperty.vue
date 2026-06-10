<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePrintLayoutStore } from '@/stores/printLayout'
import type { FilterParams, BorderConfig, ShadowConfig } from '@/types'
import { DEFAULT_FILTER_PARAMS } from '@/types'
import {
  Move,
  Maximize2,
  RotateCw,
  Crop,
  Square,
  Layers,
  Sliders,
  Trash2,
  Lock,
  Unlock,
  Sun,
  Contrast,
  Thermometer,
  Sparkles,
  Palette,
  RotateCcw,
} from 'lucide-vue-next'

const store = usePrintLayoutStore()

const lockAspectRatio = ref(true)
const originalAspectRatio = ref(1)

const selectedImage = computed(() => {
  if (store.selectedImageIds.length !== 1) return null
  return store.images.find((img) => img.id === store.selectedImageIds[0]) || null
})

const imageX = computed({
  get: () => selectedImage.value?.x ?? 0,
  set: (val: number) => {
    if (selectedImage.value) {
      store.updateImagePosition(selectedImage.value.id, val, selectedImage.value.y)
    }
  },
})

const imageY = computed({
  get: () => selectedImage.value?.y ?? 0,
  set: (val: number) => {
    if (selectedImage.value) {
      store.updateImagePosition(selectedImage.value.id, selectedImage.value.x, val)
    }
  },
})

const imageWidth = computed({
  get: () => selectedImage.value?.width ?? 0,
  set: (val: number) => {
    if (selectedImage.value) {
      if (lockAspectRatio.value) {
        const newHeight = val / originalAspectRatio.value
        store.updateImageSize(selectedImage.value.id, val, newHeight)
      } else {
        store.updateImageSize(selectedImage.value.id, val, selectedImage.value.height)
      }
    }
  },
})

const imageHeight = computed({
  get: () => selectedImage.value?.height ?? 0,
  set: (val: number) => {
    if (selectedImage.value) {
      if (lockAspectRatio.value) {
        const newWidth = val * originalAspectRatio.value
        store.updateImageSize(selectedImage.value.id, newWidth, val)
      } else {
        store.updateImageSize(selectedImage.value.id, selectedImage.value.width, val)
      }
    }
  },
})

const imageRotation = computed({
  get: () => selectedImage.value?.rotation ?? 0,
  set: (val: number) => {
    if (selectedImage.value) {
      const clamped = Math.max(-360, Math.min(360, val))
      store.updateImageRotation(selectedImage.value.id, Number(clamped.toFixed(1)))
    }
  },
})

const borderWidth = computed({
  get: () => selectedImage.value?.border?.width ?? 0,
  set: (val: number) => {
    if (selectedImage.value) {
      const currentBorder = selectedImage.value.border
      if (val > 0) {
        store.updateImageBorder(selectedImage.value.id, {
          width: val,
          color: currentBorder?.color || '#FFFFFF',
          borderRadius: currentBorder?.borderRadius || 0,
          shadow: currentBorder?.shadow || null,
        })
      } else {
        store.updateImageBorder(selectedImage.value.id, null)
      }
    }
  },
})

const borderColor = computed({
  get: () => selectedImage.value?.border?.color || '#FFFFFF',
  set: (val: string) => {
    if (selectedImage.value) {
      const currentBorder = selectedImage.value.border
      if (currentBorder) {
        store.updateImageBorder(selectedImage.value.id, {
          ...currentBorder,
          color: val,
        })
      }
    }
  },
})

const borderRadius = computed({
  get: () => selectedImage.value?.border?.borderRadius ?? 0,
  set: (val: number) => {
    if (selectedImage.value) {
      const currentBorder = selectedImage.value.border
      if (currentBorder) {
        store.updateImageBorder(selectedImage.value.id, {
          ...currentBorder,
          borderRadius: val,
        })
      }
    }
  },
})

const shadowEnabled = computed({
  get: () => selectedImage.value?.border?.shadow !== null,
  set: (val: boolean) => {
    if (selectedImage.value) {
      const currentBorder = selectedImage.value.border
      if (val) {
        const shadow: ShadowConfig = currentBorder?.shadow || {
          offsetX: 2,
          offsetY: 2,
          blur: 8,
          color: '#000000',
          opacity: 30,
        }
        if (currentBorder) {
          store.updateImageBorder(selectedImage.value.id, {
            ...currentBorder,
            shadow,
          })
        } else {
          store.updateImageBorder(selectedImage.value.id, {
            width: 0,
            color: '#FFFFFF',
            borderRadius: 0,
            shadow,
          })
        }
      } else {
        if (currentBorder) {
          store.updateImageBorder(selectedImage.value.id, {
            ...currentBorder,
            shadow: null,
          })
        }
      }
    }
  },
})

const shadowOffsetX = computed({
  get: () => selectedImage.value?.border?.shadow?.offsetX ?? 0,
  set: (val: number) => updateShadow('offsetX', val),
})

const shadowOffsetY = computed({
  get: () => selectedImage.value?.border?.shadow?.offsetY ?? 0,
  set: (val: number) => updateShadow('offsetY', val),
})

const shadowBlur = computed({
  get: () => selectedImage.value?.border?.shadow?.blur ?? 0,
  set: (val: number) => updateShadow('blur', val),
})

const shadowColor = computed({
  get: () => selectedImage.value?.border?.shadow?.color || '#000000',
  set: (val: string) => updateShadow('color', val),
})

const shadowOpacity = computed({
  get: () => selectedImage.value?.border?.shadow?.opacity ?? 0,
  set: (val: number) => updateShadow('opacity', val),
})

function updateShadow(key: keyof ShadowConfig, value: number | string) {
  if (!selectedImage.value) return
  const currentBorder = selectedImage.value.border
  const currentShadow = currentBorder?.shadow
  if (!currentShadow) return

  const updatedShadow: ShadowConfig = {
    ...currentShadow,
    [key]: value,
  }

  store.updateImageBorder(selectedImage.value.id, {
    ...currentBorder!,
    shadow: updatedShadow,
  })
}

const brightness = computed({
  get: () => selectedImage.value?.filterParams.brightness ?? DEFAULT_FILTER_PARAMS.brightness,
  set: (val: number) => updateFilter('brightness', val),
})

const contrast = computed({
  get: () => selectedImage.value?.filterParams.contrast ?? DEFAULT_FILTER_PARAMS.contrast,
  set: (val: number) => updateFilter('contrast', val),
})

const temperature = computed({
  get: () => selectedImage.value?.filterParams.temperature ?? DEFAULT_FILTER_PARAMS.temperature,
  set: (val: number) => updateFilter('temperature', val),
})

const grain = computed({
  get: () => selectedImage.value?.filterParams.grain ?? DEFAULT_FILTER_PARAMS.grain,
  set: (val: number) => updateFilter('grain', val),
})

const saturate = computed({
  get: () => selectedImage.value?.filterParams.saturate ?? DEFAULT_FILTER_PARAMS.saturate,
  set: (val: number) => updateFilter('saturate', val),
})

function updateFilter(key: keyof FilterParams, value: number) {
  if (selectedImage.value) {
    store.updateImageFilter(selectedImage.value.id, { [key]: value })
  }
}

function resetFilter(key: keyof FilterParams) {
  if (selectedImage.value) {
    store.updateImageFilter(selectedImage.value.id, { [key]: DEFAULT_FILTER_PARAMS[key] })
  }
}

function resetAllFilters() {
  if (selectedImage.value) {
    store.updateImageFilter(selectedImage.value.id, { ...DEFAULT_FILTER_PARAMS })
  }
}

function isFilterDefault(key: keyof FilterParams) {
  return selectedImage.value?.filterParams[key] === DEFAULT_FILTER_PARAMS[key]
}

const hasFilterChanges = computed(() => {
  if (!selectedImage.value) return false
  return Object.entries(DEFAULT_FILTER_PARAMS).some(
    ([key, value]) => {
      const current = selectedImage.value!.filterParams[key as keyof FilterParams]
      if (typeof value === 'object') return JSON.stringify(current) !== JSON.stringify(value)
      return current !== value
    },
  )
})

interface ParamConfig {
  key: keyof FilterParams
  label: string
  min: number
  max: number
  step: number
  icon: any
  unit: string
}

const filterParamConfigs: ParamConfig[] = [
  { key: 'brightness', label: '亮度', min: 0, max: 200, step: 1, icon: Sun, unit: '%' },
  { key: 'contrast', label: '对比度', min: 0, max: 200, step: 1, icon: Contrast, unit: '%' },
  { key: 'temperature', label: '色温', min: -100, max: 100, step: 1, icon: Thermometer, unit: '' },
  { key: 'grain', label: '颗粒感', min: 0, max: 100, step: 1, icon: Sparkles, unit: '' },
  { key: 'saturate', label: '饱和度', min: 0, max: 200, step: 1, icon: Palette, unit: '%' },
]

function getSliderBackground(value: number, min: number, max: number) {
  const pct = ((value - min) / (max - min)) * 100
  return `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-secondary) ${pct}%, var(--bg-secondary) 100%)`
}

function startCropping() {
  if (selectedImage.value) {
    store.startCropping(selectedImage.value.id)
  }
}

function resetCrop() {
  if (selectedImage.value) {
    store.updateImageCrop(selectedImage.value.id, null)
  }
}

function deleteImage() {
  if (selectedImage.value) {
    store.removeImage(selectedImage.value.id)
  }
}

function toggleAspectRatioLock() {
  lockAspectRatio.value = !lockAspectRatio.value
}

watch(
  () => selectedImage.value,
  (img) => {
    if (img) {
      originalAspectRatio.value = img.width / img.height
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="image-property">
    <div v-if="!selectedImage" class="empty-state">
      <div class="empty-icon">
        <Square :size="48" />
      </div>
      <p class="empty-text">请选择一张图片查看属性</p>
      <p class="empty-hint">点击画布中的图片进行选择</p>
    </div>

    <div v-else class="property-content">
      <div class="image-header">
        <div class="image-name">
          <Square :size="18" class="name-icon" />
          <span class="name-text">{{ selectedImage.name }}</span>
        </div>
        <button class="delete-btn" @click="deleteImage" title="删除图片">
          <Trash2 :size="16" />
        </button>
      </div>

      <div class="property-cards">
        <div class="card-film property-card">
          <div class="card-header">
            <div class="card-title">
              <Move :size="14" class="title-icon" />
              <span>位置</span>
            </div>
          </div>
          <div class="card-body">
            <div class="input-row">
              <div class="input-group">
                <label class="input-label">X</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="imageX"
                    step="0.1"
                  />
                  <span class="input-unit">mm</span>
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">Y</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="imageY"
                    step="0.1"
                  />
                  <span class="input-unit">mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-film property-card">
          <div class="card-header">
            <div class="card-title">
              <Maximize2 :size="14" class="title-icon" />
              <span>尺寸</span>
            </div>
            <button
              class="lock-btn"
              :class="{ 'lock-btn--locked': lockAspectRatio }"
              @click="toggleAspectRatioLock"
              :title="lockAspectRatio ? '解锁宽高比' : '锁定宽高比'"
            >
              <Lock v-if="lockAspectRatio" :size="14" />
              <Unlock v-else :size="14" />
            </button>
          </div>
          <div class="card-body">
            <div class="input-row">
              <div class="input-group">
                <label class="input-label">宽度</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="imageWidth"
                    min="1"
                    step="0.1"
                  />
                  <span class="input-unit">mm</span>
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">高度</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="imageHeight"
                    min="1"
                    step="0.1"
                  />
                  <span class="input-unit">mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-film property-card">
          <div class="card-header">
            <div class="card-title">
              <RotateCw :size="14" class="title-icon" />
              <span>旋转</span>
            </div>
          </div>
          <div class="card-body">
            <div class="rotation-input">
              <div class="input-with-unit">
                <input
                  type="number"
                  class="form-input rotation-number"
                  v-model.number="imageRotation"
                  min="-360"
                  max="360"
                  step="0.1"
                />
                <span class="input-unit">°</span>
              </div>
            </div>
            <input
              type="range"
              class="param-slider rotation-slider"
              v-model.number="imageRotation"
              min="-360"
              max="360"
              step="0.1"
              :style="{ background: getSliderBackground(imageRotation, -360, 360) }"
            />
            <div class="rotation-labels">
              <span>-360°</span>
              <span>0°</span>
              <span>360°</span>
            </div>
          </div>
        </div>

        <div class="card-film property-card">
          <div class="card-header">
            <div class="card-title">
              <Crop :size="14" class="title-icon" />
              <span>裁剪</span>
            </div>
          </div>
          <div class="card-body">
            <div class="button-row">
              <button class="btn-film btn-film-primary" @click="startCropping">
                <Crop :size="14" />
                <span>开始裁剪</span>
              </button>
              <button
                class="btn-film btn-film-secondary"
                @click="resetCrop"
                :disabled="!selectedImage.crop"
              >
                <RotateCcw :size="14" />
                <span>重置裁剪</span>
              </button>
            </div>
          </div>
        </div>

        <div class="card-film property-card">
          <div class="card-header">
            <div class="card-title">
              <Square :size="14" class="title-icon" />
              <span>边框</span>
            </div>
          </div>
          <div class="card-body">
            <div class="input-row">
              <div class="input-group">
                <label class="input-label">宽度</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="borderWidth"
                    min="0"
                    max="20"
                    step="0.5"
                  />
                  <span class="input-unit">mm</span>
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">圆角</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="borderRadius"
                    min="0"
                    max="50"
                    step="0.5"
                  />
                  <span class="input-unit">mm</span>
                </div>
              </div>
            </div>
            <div class="color-input-group">
              <label class="input-label">颜色</label>
              <div class="color-picker-wrapper">
                <input
                  type="color"
                  class="color-picker"
                  v-model="borderColor"
                />
                <span class="color-value">{{ borderColor }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-film property-card">
          <div class="card-header">
            <div class="card-title">
              <Layers :size="14" class="title-icon" />
              <span>阴影</span>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" v-model="shadowEnabled" />
              <span class="toggle-slider"></span>
            </label>
          </div>
          <div v-if="shadowEnabled" class="card-body">
            <div class="input-row">
              <div class="input-group">
                <label class="input-label">偏移 X</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="shadowOffsetX"
                    step="1"
                  />
                  <span class="input-unit">px</span>
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">偏移 Y</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="shadowOffsetY"
                    step="1"
                  />
                  <span class="input-unit">px</span>
                </div>
              </div>
            </div>
            <div class="input-row">
              <div class="input-group">
                <label class="input-label">模糊</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="shadowBlur"
                    min="0"
                    step="1"
                  />
                  <span class="input-unit">px</span>
                </div>
              </div>
              <div class="input-group">
                <label class="input-label">透明度</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="shadowOpacity"
                    min="0"
                    max="100"
                    step="1"
                  />
                  <span class="input-unit">%</span>
                </div>
              </div>
            </div>
            <div class="color-input-group">
              <label class="input-label">颜色</label>
              <div class="color-picker-wrapper">
                <input
                  type="color"
                  class="color-picker"
                  v-model="shadowColor"
                />
                <span class="color-value">{{ shadowColor }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card-film property-card">
          <div class="card-header">
            <div class="card-title">
              <Sliders :size="14" class="title-icon" />
              <span>调色</span>
            </div>
            <button
              v-if="hasFilterChanges"
              class="param-reset"
              @click="resetAllFilters"
            >
              全部重置
            </button>
          </div>
          <div class="card-body">
            <div class="param-list">
              <div
                v-for="config in filterParamConfigs"
                :key="config.key"
                class="param-item"
                :class="{ 'param-item--active': !isFilterDefault(config.key) }"
              >
                <div class="param-row">
                  <div class="param-label">
                    <component :is="config.icon" :size="14" class="param-icon" />
                    <span>{{ config.label }}</span>
                  </div>
                  <div class="param-value">
                    <span class="param-number">{{ selectedImage.filterParams[config.key] }}</span>
                    <span class="param-unit">{{ config.unit }}</span>
                    <button
                      v-if="!isFilterDefault(config.key)"
                      class="param-reset-btn"
                      @click="resetFilter(config.key)"
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
                  :value="selectedImage.filterParams[config.key]"
                  class="param-slider"
                  :style="{ background: getSliderBackground(selectedImage.filterParams[config.key] as number, config.min, config.max) }"
                  @input="(e: Event) => (selectedImage.filterParams[config.key] = Number((e.target as HTMLInputElement).value) as any)"
                  @change="(e: Event) => updateFilter(config.key, Number((e.target as HTMLInputElement).value))"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-property {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--border-color);
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 0.95rem;
  color: var(--text-primary);
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.property-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.image-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.name-icon {
  color: var(--accent);
}

.name-text {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(192, 57, 43, 0.1);
  border-color: rgba(192, 57, 43, 0.3);
  color: #c0392b;
}

.property-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-card {
  background: var(--bg-card);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.title-icon {
  color: var(--accent);
}

.card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.input-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 8px 36px 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-input:hover {
  border-color: var(--accent);
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.15);
}

.input-unit {
  position: absolute;
  right: 10px;
  font-size: 0.7rem;
  color: var(--text-secondary);
  pointer-events: none;
}

.lock-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.lock-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.lock-btn--locked {
  background: rgba(212, 168, 83, 0.1);
  border-color: var(--accent);
  color: var(--accent);
}

.rotation-input {
  margin-bottom: 4px;
}

.rotation-number {
  text-align: center;
  padding-right: 28px !important;
  font-size: 1.1rem !important;
  font-weight: 600 !important;
}

.rotation-slider {
  height: 6px;
}

.rotation-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.button-row {
  display: flex;
  gap: 10px;
}

.button-row .btn-film {
  flex: 1;
  justify-content: center;
  padding: 8px 12px;
  font-size: 0.8rem;
}

.button-row .btn-film:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.color-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-picker {
  width: 40px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  padding: 2px;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border-radius: 4px;
  border: none;
}

.color-value {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  transition: 0.2s;
  border-radius: 22px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: var(--text-secondary);
  transition: 0.2s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: rgba(212, 168, 83, 0.3);
  border-color: var(--accent);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(18px);
  background-color: var(--accent);
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
  color: #1a1614;
}

.param-list {
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
