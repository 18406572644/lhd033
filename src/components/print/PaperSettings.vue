<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { useUnitConversion } from '@/composables/useUnitConversion'
import { PAPER_SIZES, DPI_OPTIONS } from '@/types'
import type { PaperSize } from '@/types'
import {
  FileText,
  Ruler,
  RotateCcw,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  Target,
  Scan,
  Monitor,
} from 'lucide-vue-next'

const store = usePrintLayoutStore()
const { currentDpi, currentUnit, toPx, fromMm, toMm, fromPx, displayValue } = useUnitConversion(
  computed(() => store.paper.dpi),
)

const customSize = ref({
  width: store.paper.size.width,
  height: store.paper.size.height,
})

const allPaperSizes = computed<PaperSize[]>(() => [
  ...PAPER_SIZES,
  { id: 'custom', name: '自定义', width: 0, height: 0, isCustom: true },
])

const isCustomSize = computed(() => store.paper.size.isCustom === true)

const displayWidth = computed({
  get: () => {
    if (isCustomSize.value) {
      return Number(fromMm(customSize.value.width).toFixed(1))
    }
    return Number(fromMm(store.paperWidth).toFixed(1))
  },
  set: (val: number) => {
    customSize.value.width = toMm(val)
    updateCustomSize()
  },
})

const displayHeight = computed({
  get: () => {
    if (isCustomSize.value) {
      return Number(fromMm(customSize.value.height).toFixed(1))
    }
    return Number(fromMm(store.paperHeight).toFixed(1))
  },
  set: (val: number) => {
    customSize.value.height = toMm(val)
    updateCustomSize()
  },
})

const marginTop = computed({
  get: () => Number(fromMm(store.paper.margins.top).toFixed(1)),
  set: (val: number) => store.setMargins({ top: toMm(val) }),
})

const marginRight = computed({
  get: () => Number(fromMm(store.paper.margins.right).toFixed(1)),
  set: (val: number) => store.setMargins({ right: toMm(val) }),
})

const marginBottom = computed({
  get: () => Number(fromMm(store.paper.margins.bottom).toFixed(1)),
  set: (val: number) => store.setMargins({ bottom: toMm(val) }),
})

const marginLeft = computed({
  get: () => Number(fromMm(store.paper.margins.left).toFixed(1)),
  set: (val: number) => store.setMargins({ left: toMm(val) }),
})

const pixelSizeText = computed(() => {
  return `${Math.round(store.paperPixelWidth)} × ${Math.round(store.paperPixelHeight)} px`
})

const physicalSizeText = computed(() => {
  const w = store.paperWidth
  const h = store.paperHeight
  return `${w.toFixed(1)} × ${h.toFixed(1)} mm`
})

function selectPaperSize(size: PaperSize) {
  if (size.isCustom) {
    customSize.value = {
      width: store.paper.size.width,
      height: store.paper.size.height,
    }
    store.setPaperSize({
      ...size,
      width: customSize.value.width,
      height: customSize.value.height,
    })
  } else {
    store.setPaperSize(size)
  }
}

function updateCustomSize() {
  if (isCustomSize.value) {
    store.setPaperSize({
      id: 'custom',
      name: '自定义',
      width: customSize.value.width,
      height: customSize.value.height,
      isCustom: true,
    })
  }
}

function setOrientation(orientation: 'portrait' | 'landscape') {
  store.setOrientation(orientation)
}

function setDpi(dpi: number) {
  currentDpi.value = dpi
  store.setDpi(dpi)
}

function setUnit(unit: 'mm' | 'cm' | 'inch') {
  currentUnit.value = unit
}

function centerMargins() {
  store.centerMargins()
}

watch(
  () => store.paper.size,
  (size) => {
    if (size.isCustom) {
      customSize.value = {
        width: size.width,
        height: size.height,
      }
    }
  },
)
</script>

<template>
  <div class="paper-settings">
    <div class="card-film settings-card">
      <div class="card-header">
        <div class="card-title">
          <FileText :size="16" class="title-icon" />
          <span>纸张设置</span>
        </div>
        <div class="pixel-info" :title="physicalSizeText">
          <Monitor :size="12" />
          <span>{{ pixelSizeText }}</span>
        </div>
      </div>

      <div class="card-body">
        <div class="form-group">
          <label class="group-label">
            <Maximize2 :size="14" class="label-icon" />
            <span>纸张规格</span>
          </label>
          <select
            class="form-select"
            :value="store.paper.size.id"
            @change="(e) => {
              const size = allPaperSizes.find(s => s.id === (e.target as HTMLSelectElement).value)
              if (size) selectPaperSize(size)
            }"
          >
            <option v-for="size in allPaperSizes" :key="size.id" :value="size.id">
              {{ size.name }}
              <template v-if="!size.isCustom">
                ({{ size.width }}×{{ size.height }}mm)
              </template>
            </option>
          </select>
        </div>

        <div v-if="isCustomSize" class="custom-size-section">
          <div class="unit-toggle">
            <span class="unit-label">单位：</span>
            <div class="unit-buttons">
              <button
                v-for="unit in (['mm', 'cm', 'inch'] as const)"
                :key="unit"
                class="unit-btn"
                :class="{ 'unit-btn--active': currentUnit === unit }"
                @click="setUnit(unit)"
              >
                {{ displayValue.label }}
              </button>
            </div>
          </div>
          <div class="size-inputs">
            <div class="size-input-group">
              <label class="size-label">宽度</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  class="form-input"
                  v-model.number="displayWidth"
                  min="1"
                  step="0.1"
                />
                <span class="input-unit">{{ displayValue.label }}</span>
              </div>
            </div>
            <div class="size-input-group">
              <label class="size-label">高度</label>
              <div class="input-with-unit">
                <input
                  type="number"
                  class="form-input"
                  v-model.number="displayHeight"
                  min="1"
                  step="0.1"
                />
                <span class="input-unit">{{ displayValue.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="group-label">
            <RotateCcw :size="14" class="label-icon" />
            <span>纸张方向</span>
          </label>
          <div class="orientation-buttons">
            <button
              class="orientation-btn"
              :class="{ 'orientation-btn--active': store.paper.orientation === 'portrait' }"
              @click="setOrientation('portrait')"
            >
              <div class="orientation-icon portrait">
                <div class="paper-shape"></div>
              </div>
              <span>纵向</span>
            </button>
            <button
              class="orientation-btn"
              :class="{ 'orientation-btn--active': store.paper.orientation === 'landscape' }"
              @click="setOrientation('landscape')"
            >
              <div class="orientation-icon landscape">
                <div class="paper-shape"></div>
              </div>
              <span>横向</span>
            </button>
          </div>
        </div>

        <div class="form-group">
          <div class="group-label-row">
            <label class="group-label">
              <Ruler :size="14" class="label-icon" />
              <span>边距设置</span>
            </label>
            <button class="center-btn" @click="centerMargins" title="一键居中">
              <Target :size="12" />
              <span>居中</span>
            </button>
          </div>
          <div class="margin-inputs">
            <div class="margin-row">
              <div class="margin-input-group">
                <label class="margin-label">
                  <MoveVertical :size="12" />
                  <span>上</span>
                </label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="marginTop"
                    min="0"
                    step="0.1"
                  />
                  <span class="input-unit">{{ displayValue.label }}</span>
                </div>
              </div>
            </div>
            <div class="margin-row">
              <div class="margin-input-group">
                <label class="margin-label">
                  <MoveHorizontal :size="12" />
                  <span>左</span>
                </label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="marginLeft"
                    min="0"
                    step="0.1"
                  />
                  <span class="input-unit">{{ displayValue.label }}</span>
                </div>
              </div>
              <div class="margin-preview">
                <div class="margin-preview-inner">
                  <div class="content-area"></div>
                </div>
              </div>
              <div class="margin-input-group">
                <label class="margin-label">
                  <MoveHorizontal :size="12" />
                  <span>右</span>
                </label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="marginRight"
                    min="0"
                    step="0.1"
                  />
                  <span class="input-unit">{{ displayValue.label }}</span>
                </div>
              </div>
            </div>
            <div class="margin-row">
              <div class="margin-input-group">
                <label class="margin-label">
                  <MoveVertical :size="12" />
                  <span>下</span>
                </label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    class="form-input"
                    v-model.number="marginBottom"
                    min="0"
                    step="0.1"
                  />
                  <span class="input-unit">{{ displayValue.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="group-label">
            <Scan :size="14" class="label-icon" />
            <span>打印精度 (DPI)</span>
          </label>
          <div class="dpi-options">
            <label
              v-for="dpi in DPI_OPTIONS"
              :key="dpi"
              class="dpi-option"
              :class="{ 'dpi-option--active': store.paper.dpi === dpi }"
            >
              <input
                type="radio"
                :value="dpi"
                :checked="store.paper.dpi === dpi"
                @change="setDpi(dpi)"
                class="dpi-radio"
              />
              <span class="dpi-label">{{ dpi }}</span>
              <span class="dpi-desc">{{ dpi === 150 ? '草稿' : dpi === 300 ? '标准' : '高清' }}</span>
            </label>
          </div>
        </div>

        <div class="size-summary">
          <div class="summary-item">
            <span class="summary-label">物理尺寸</span>
            <span class="summary-value">{{ physicalSizeText }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">像素尺寸</span>
            <span class="summary-value accent">{{ pixelSizeText }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.paper-settings {
  width: 100%;
}

.settings-card {
  background: var(--bg-card);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.title-icon {
  color: var(--accent);
}

.pixel-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.card-body {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.label-icon {
  color: var(--accent);
}

.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.form-select:hover {
  border-color: var(--accent);
}

.form-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.15);
}

.custom-size-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border: 1px dashed var(--border-color);
}

.unit-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unit-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.unit-buttons {
  display: flex;
  gap: 4px;
}

.unit-btn {
  padding: 4px 10px;
  font-size: 0.75rem;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.unit-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.unit-btn--active {
  background: var(--accent);
  border-color: var(--accent);
  color: #1A1614;
  font-weight: 500;
}

.size-inputs {
  display: flex;
  gap: 12px;
}

.size-input-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.size-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
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
  background: var(--bg-card);
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

.orientation-buttons {
  display: flex;
  gap: 10px;
}

.orientation-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.orientation-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
}

.orientation-btn--active {
  border-color: var(--accent);
  background: rgba(212, 168, 83, 0.1);
  color: var(--text-primary);
}

.orientation-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orientation-icon.portrait .paper-shape {
  width: 16px;
  height: 24px;
  border: 2px solid currentColor;
  border-radius: 2px;
}

.orientation-icon.landscape .paper-shape {
  width: 24px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 2px;
}

.orientation-btn span {
  font-size: 0.8rem;
  font-weight: 500;
}

.center-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 0.75rem;
  border: 1px solid var(--accent);
  background: transparent;
  color: var(--accent);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.center-btn:hover {
  background: var(--accent);
  color: #1A1614;
}

.margin-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.margin-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.margin-input-group {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 100px;
}

.margin-label {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  min-width: 28px;
}

.margin-preview {
  width: 80px;
  height: 60px;
  padding: 6px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
}

.margin-preview-inner {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
}

.content-area {
  position: absolute;
  top: 25%;
  left: 25%;
  right: 25%;
  bottom: 25%;
  background: rgba(212, 168, 83, 0.2);
  border: 1px dashed var(--accent);
  border-radius: 2px;
}

.dpi-options {
  display: flex;
  gap: 8px;
}

.dpi-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dpi-option:hover {
  border-color: var(--accent);
}

.dpi-option--active {
  border-color: var(--accent);
  background: rgba(212, 168, 83, 0.1);
}

.dpi-radio {
  display: none;
}

.dpi-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.dpi-option--active .dpi-label {
  color: var(--accent);
}

.dpi-desc {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.size-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  border-top: 1px solid var(--border-color);
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
}

.summary-label {
  color: var(--text-secondary);
}

.summary-value {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

.summary-value.accent {
  color: var(--accent);
  font-weight: 600;
}
</style>
