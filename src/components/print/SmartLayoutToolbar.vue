<script setup lang="ts">
import { computed } from 'vue'
import { usePrintLayoutStore } from '@/stores/printLayout'
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  StretchHorizontal,
  StretchVertical,
  Grid,
  Ruler,
  BringToFront,
  SendToBack,
  ChevronsRight,
  ChevronsDown,
} from 'lucide-vue-next'

const store = usePrintLayoutStore()

const hasSelection = computed(() => store.selectedImageIds.length > 0)
const hasMultipleSelection = computed(() => store.selectedImageIds.length >= 2)

function toggleGuides() {
  const newShowGuides = !store.smartLayout.showGuides
  store.setSmartLayout({
    showGuides: newShowGuides,
    snapToGuides: newShowGuides ? store.smartLayout.snapToGuides : false,
  })
}

function toggleSnapToGuides() {
  store.setSmartLayout({
    snapToGuides: !store.smartLayout.snapToGuides,
    showGuides: store.smartLayout.snapToGuides ? store.smartLayout.showGuides : true,
  })
}

function toggleGrid() {
  const newShowGrid = !store.smartLayout.showGrid
  store.setSmartLayout({
    showGrid: newShowGrid,
    snapToGrid: newShowGrid ? store.smartLayout.snapToGrid : false,
  })
}

function toggleSnapToGrid() {
  store.setSmartLayout({
    snapToGrid: !store.smartLayout.snapToGrid,
    showGrid: store.smartLayout.snapToGrid ? store.smartLayout.showGrid : true,
  })
}

function onGridSizeInput(value: number) {
  store.setSmartLayout({ gridSize: value })
}

function handleAlignLeft() {
  if (!hasSelection.value) return
  store.alignLeft()
}

function handleAlignCenter() {
  if (!hasSelection.value) return
  store.alignCenter()
}

function handleAlignRight() {
  if (!hasSelection.value) return
  store.alignRight()
}

function handleAlignTop() {
  if (!hasSelection.value) return
  store.alignTop()
}

function handleAlignMiddle() {
  if (!hasSelection.value) return
  store.alignMiddle()
}

function handleAlignBottom() {
  if (!hasSelection.value) return
  store.alignBottom()
}

function handleDistributeHorizontal() {
  if (!hasMultipleSelection.value) return
  store.distributeHorizontally()
}

function handleDistributeVertical() {
  if (!hasMultipleSelection.value) return
  store.distributeVertically()
}

function handleSameWidth() {
  if (!hasMultipleSelection.value) return
  store.sameWidth()
}

function handleSameHeight() {
  if (!hasMultipleSelection.value) return
  store.sameHeight()
}

function handleBringToFront() {
  if (!hasSelection.value) return
  store.selectedImageIds.forEach((id) => store.bringToFront(id))
}

function handleSendToBack() {
  if (!hasSelection.value) return
  store.selectedImageIds.forEach((id) => store.sendToBack(id))
}

function getSliderBackground(value: number) {
  const pct = ((value - 1) / (20 - 1)) * 100
  return `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-secondary) ${pct}%, var(--bg-secondary) 100%)`
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-section">
      <div class="section-title">辅助设置</div>
      <div class="button-group">
        <button
          class="icon-btn"
          :class="{
            'icon-btn--active': store.smartLayout.showGuides,
            'icon-btn--snap': store.smartLayout.snapToGuides,
            'icon-btn--disabled': !hasSelection,
          }"
          @click="toggleGuides"
          @contextmenu.prevent="toggleSnapToGuides"
          title="辅助线（右键切换吸附）"
        >
          <Ruler :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{
            'icon-btn--active': store.smartLayout.showGrid,
            'icon-btn--snap': store.smartLayout.snapToGrid,
          }"
          @click="toggleGrid"
          @contextmenu.prevent="toggleSnapToGrid"
          title="网格（右键切换吸附）"
        >
          <Grid :size="18" />
        </button>
      </div>
      <div v-if="store.smartLayout.showGrid" class="grid-density">
        <div class="density-label">
          <span>网格密度</span>
          <span class="density-value">{{ store.smartLayout.gridSize }}mm</span>
        </div>
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          :value="store.smartLayout.gridSize"
          class="param-slider"
          :style="{ background: getSliderBackground(store.smartLayout.gridSize) }"
          @input="(e: Event) => onGridSizeInput(Number((e.target as HTMLInputElement).value))"
        />
      </div>
    </div>

    <div class="divider" />

    <div class="toolbar-section">
      <div class="section-title">对齐</div>
      <div class="button-group">
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasSelection }"
          :disabled="!hasSelection"
          @click="handleAlignLeft"
          title="左对齐"
        >
          <AlignLeft :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasSelection }"
          :disabled="!hasSelection"
          @click="handleAlignCenter"
          title="水平居中"
        >
          <AlignCenter :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasSelection }"
          :disabled="!hasSelection"
          @click="handleAlignRight"
          title="右对齐"
        >
          <AlignRight :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasSelection }"
          :disabled="!hasSelection"
          @click="handleAlignTop"
          title="顶端对齐"
        >
          <AlignStartVertical :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasSelection }"
          :disabled="!hasSelection"
          @click="handleAlignMiddle"
          title="垂直居中"
        >
          <AlignCenterVertical :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasSelection }"
          :disabled="!hasSelection"
          @click="handleAlignBottom"
          title="底端对齐"
        >
          <AlignEndVertical :size="18" />
        </button>
      </div>
    </div>

    <div class="divider" />

    <div class="toolbar-section">
      <div class="section-title">分布</div>
      <div class="button-group">
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasMultipleSelection }"
          :disabled="!hasMultipleSelection"
          @click="handleDistributeHorizontal"
          title="水平等间距分布"
        >
          <StretchHorizontal :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasMultipleSelection }"
          :disabled="!hasMultipleSelection"
          @click="handleDistributeVertical"
          title="垂直等间距分布"
        >
          <StretchVertical :size="18" />
        </button>
      </div>
    </div>

    <div class="divider" />

    <div class="toolbar-section">
      <div class="section-title">尺寸</div>
      <div class="button-group">
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasMultipleSelection }"
          :disabled="!hasMultipleSelection"
          @click="handleSameWidth"
          title="统一宽度"
        >
          <ChevronsRight :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasMultipleSelection }"
          :disabled="!hasMultipleSelection"
          @click="handleSameHeight"
          title="统一高度"
        >
          <ChevronsDown :size="18" />
        </button>
      </div>
    </div>

    <div class="divider" />

    <div class="toolbar-section">
      <div class="section-title">图层</div>
      <div class="button-group">
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasSelection }"
          :disabled="!hasSelection"
          @click="handleBringToFront"
          title="置顶"
        >
          <BringToFront :size="18" />
        </button>
        <button
          class="icon-btn"
          :class="{ 'icon-btn--disabled': !hasSelection }"
          :disabled="!hasSelection"
          @click="handleSendToBack"
          title="置底"
        >
          <SendToBack :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  flex-wrap: wrap;
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.button-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.divider {
  width: 1px;
  height: 56px;
  background: var(--border-color);
  margin: 0 4px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.icon-btn:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--bg-card);
  box-shadow: 0 0 16px rgba(212, 168, 83, 0.3);
  transform: translateY(-1px);
}

.icon-btn--active {
  color: var(--accent);
  background: rgba(212, 168, 83, 0.15);
}

.icon-btn--active:hover:not(:disabled) {
  background: rgba(212, 168, 83, 0.25);
  box-shadow: 0 0 20px rgba(212, 168, 83, 0.5);
}

.icon-btn--snap::after {
  content: '';
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(212, 168, 83, 0.8);
}

.icon-btn--disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.grid-density {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
  min-width: 140px;
}

.density-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.density-value {
  font-weight: 600;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.param-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 12px rgba(212, 168, 83, 0.6);
}

.param-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
