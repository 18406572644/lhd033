<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { usePrintLayout } from '@/composables/usePrintLayout'
import { mmToPx } from '@/lib/unitConversion'
import ImageItem from './ImageItem.vue'
import { Move, ZoomIn, ZoomOut } from 'lucide-vue-next'

const store = usePrintLayoutStore()
const { paper, images, selectedImageIds, smartLayout, activeGuides, zoom, canvasOffset, paperPixelWidth, paperPixelHeight, contentArea } = storeToRefs(store)

const canvasContainerRef = ref<HTMLDivElement | null>(null)
const canvasWrapperRef = ref<HTMLDivElement | null>(null)
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

const {
  handleMouseDown,
  handleDoubleClick,
  handleKeyDown,
  handleCanvasMouseDown,
  selectionBox,
  isSelecting,
} = usePrintLayout()

const canvasStyle = computed(() => {
  const width = paperPixelWidth.value
  const height = paperPixelHeight.value
  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(${canvasOffset.value.x}px, ${canvasOffset.value.y}px) scale(${zoom.value})`,
    transformOrigin: '0 0',
  }
})

const marginLines = computed(() => {
  const dpi = paper.value.dpi
  const left = mmToPx(contentArea.value.x, dpi)
  const top = mmToPx(contentArea.value.y, dpi)
  const right = mmToPx(contentArea.value.x + contentArea.value.width, dpi)
  const bottom = mmToPx(contentArea.value.y + contentArea.value.height, dpi)
  return { left, top, right, bottom }
})

const gridLines = computed(() => {
  if (!smartLayout.value.showGrid) return { vertical: [], horizontal: [] }
  const dpi = paper.value.dpi
  const gridSize = mmToPx(smartLayout.value.gridSize, dpi)
  const width = paperPixelWidth.value
  const height = paperPixelHeight.value
  const vertical: number[] = []
  const horizontal: number[] = []
  for (let x = gridSize; x < width; x += gridSize) {
    vertical.push(x)
  }
  for (let y = gridSize; y < height; y += gridSize) {
    horizontal.push(y)
  }
  return { vertical, horizontal }
})

const centerLines = computed(() => ({
  vertical: paperPixelWidth.value / 2,
  horizontal: paperPixelHeight.value / 2,
}))

function handleImageDragStart(imageId: string, handleType: string) {
  const mappedHandle = handleType === 'move' ? 'move' :
    handleType === 'rotate' ? 'rotate' :
    handleType === 'top-left' ? 'nw' :
    handleType === 'top-center' ? 'n' :
    handleType === 'top-right' ? 'ne' :
    handleType === 'middle-right' ? 'e' :
    handleType === 'bottom-right' ? 'se' :
    handleType === 'bottom-center' ? 's' :
    handleType === 'bottom-left' ? 'sw' :
    handleType === 'middle-left' ? 'w' : 'move'
  const fakeEvent = new MouseEvent('mousedown', { clientX: 0, clientY: 0 })
  handleMouseDown(fakeEvent, imageId, mappedHandle)
}

function handleImageSelect(imageId: string, multiSelect: boolean) {
  store.selectImage(imageId, multiSelect)
}

function handleImageDoubleClick(imageId: string) {
  handleDoubleClick(new MouseEvent('dblclick'), imageId)
}

function handleCanvasMouseDownWrapper(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.image-item')) return
  handleCanvasMouseDown(e)
}

function handlePanStart(e: MouseEvent) {
  if (e.button !== 1) return
  e.preventDefault()
  isPanning.value = true
  panStart.value = {
    x: e.clientX,
    y: e.clientY,
    offsetX: canvasOffset.value.x,
    offsetY: canvasOffset.value.y,
  }
  window.addEventListener('mousemove', handlePanMove)
  window.addEventListener('mouseup', handlePanEnd)
}

function handlePanMove(e: MouseEvent) {
  if (!isPanning.value) return
  const dx = e.clientX - panStart.value.x
  const dy = e.clientY - panStart.value.y
  store.setCanvasOffset(panStart.value.offsetX + dx, panStart.value.offsetY + dy)
}

function handlePanEnd() {
  isPanning.value = false
  window.removeEventListener('mousemove', handlePanMove)
  window.removeEventListener('mouseup', handlePanEnd)
}

function handleWheel(e: WheelEvent) {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newZoom = Math.max(0.1, Math.min(5, zoom.value * delta))
  store.setZoom(newZoom)
}

function fitToWindow() {
  if (!canvasContainerRef.value) return
  const containerWidth = canvasContainerRef.value.clientWidth - 80
  const containerHeight = canvasContainerRef.value.clientHeight - 80
  const scaleX = containerWidth / paperPixelWidth.value
  const scaleY = containerHeight / paperPixelHeight.value
  const newZoom = Math.min(scaleX, scaleY, 2)
  store.setZoom(newZoom)
  store.setCanvasOffset(
    (canvasContainerRef.value.clientWidth - paperPixelWidth.value * newZoom) / 2,
    (canvasContainerRef.value.clientHeight - paperPixelHeight.value * newZoom) / 2,
  )
}

function handleKeyDownWrapper(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  handleKeyDown(e)
}

watch(
  () => paper.value,
  () => {
    fitToWindow()
  },
  { deep: true, once: true },
)

onMounted(() => {
  fitToWindow()
  window.addEventListener('keydown', handleKeyDownWrapper)
  window.addEventListener('resize', fitToWindow)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDownWrapper)
  window.removeEventListener('resize', fitToWindow)
  window.removeEventListener('mousemove', handlePanMove)
  window.removeEventListener('mouseup', handlePanEnd)
})

defineExpose({ fitToWindow })
</script>

<template>
  <div
    ref="canvasContainerRef"
    class="layout-canvas"
    :class="{ 'is-panning': isPanning }"
    @mousedown="handleCanvasMouseDownWrapper"
    @mousedown.middle="handlePanStart"
    @wheel="handleWheel"
  >
    <div
      ref="canvasWrapperRef"
      class="canvas-wrapper"
      @contextmenu.prevent
    >
      <div class="paper-canvas" :style="canvasStyle">
        <div
          v-if="smartLayout.showGrid"
          class="grid-overlay"
        >
          <div
            v-for="x in gridLines.vertical"
            :key="'v-' + x"
            class="grid-line vertical"
            :style="{ left: x + 'px' }"
          />
          <div
            v-for="y in gridLines.horizontal"
            :key="'h-' + y"
            class="grid-line horizontal"
            :style="{ top: y + 'px' }"
          />
        </div>

        <div class="margin-lines">
          <div
            class="margin-line vertical left"
            :style="{ left: marginLines.left + 'px' }"
          />
          <div
            class="margin-line vertical right"
            :style="{ left: marginLines.right + 'px' }"
          />
          <div
            class="margin-line horizontal top"
            :style="{ top: marginLines.top + 'px' }"
          />
          <div
            class="margin-line horizontal bottom"
            :style="{ top: marginLines.bottom + 'px' }"
          />
        </div>

        <div
          v-if="smartLayout.showGuides"
          class="center-lines"
        >
          <div
            class="center-line vertical"
            :style="{ left: centerLines.vertical + 'px' }"
          />
          <div
            class="center-line horizontal"
            :style="{ top: centerLines.horizontal + 'px' }"
          />
        </div>

        <div
          v-if="smartLayout.showGuides"
          class="active-guides"
        >
          <div
            v-for="(guide, index) in activeGuides"
            :key="index"
            class="active-guide"
            :class="guide.type"
            :style="{
              left: guide.type === 'vertical' ? mmToPx(guide.position, paper.dpi) + 'px' : '0',
              top: guide.type === 'horizontal' ? mmToPx(guide.position, paper.dpi) + 'px' : '0',
              width: guide.type === 'vertical' ? '2px' : '100%',
              height: guide.type === 'horizontal' ? '2px' : '100%',
            }"
          />
        </div>

        <ImageItem
          v-for="img in images"
          :key="img.id"
          :image="img"
          :is-selected="selectedImageIds.includes(img.id)"
          :scale="zoom"
          :dpi="paper.dpi"
          @drag-start="handleImageDragStart"
          @double-click="handleImageDoubleClick"
          @select="handleImageSelect"
        />

        <div
          v-if="isSelecting && selectionBox"
          class="selection-box"
          :style="{
            left: mmToPx(Math.min(selectionBox.startX, selectionBox.endX), paper.dpi) + 'px',
            top: mmToPx(Math.min(selectionBox.startY, selectionBox.endY), paper.dpi) + 'px',
            width: mmToPx(Math.abs(selectionBox.endX - selectionBox.startX), paper.dpi) + 'px',
            height: mmToPx(Math.abs(selectionBox.endY - selectionBox.startY), paper.dpi) + 'px',
          }"
        />
      </div>
    </div>

    <div v-if="isPanning" class="panning-indicator">
      <Move :size="20" />
      <span>拖拽移动画布</span>
    </div>

    <div class="canvas-hint">
      <span>Ctrl + 滚轮缩放</span>
      <span>·</span>
      <span>中键拖拽平移</span>
    </div>
  </div>
</template>

<style scoped>
.layout-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background:
    linear-gradient(45deg, var(--bg-secondary) 25%, transparent 25%),
    linear-gradient(-45deg, var(--bg-secondary) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--bg-secondary) 75%),
    linear-gradient(-45deg, transparent 75%, var(--bg-secondary) 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: var(--bg-primary);
  cursor: default;
}

.layout-canvas.is-panning {
  cursor: grabbing;
}

.canvas-wrapper {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.paper-canvas {
  position: relative;
  background: #ffffff;
  box-shadow:
    0 0 0 1px var(--border-color),
    0 10px 40px var(--shadow),
    0 0 0 8px var(--bg-card),
    0 0 0 9px var(--border-color);
  border-radius: 2px;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.grid-line {
  position: absolute;
  background: rgba(212, 168, 83, 0.15);
}

.grid-line.vertical {
  top: 0;
  bottom: 0;
  width: 1px;
}

.grid-line.horizontal {
  left: 0;
  right: 0;
  height: 1px;
}

.margin-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.margin-line {
  position: absolute;
  background: var(--accent);
  opacity: 0.5;
}

.margin-line.vertical {
  top: 0;
  bottom: 0;
  width: 1px;
}

.margin-line.horizontal {
  left: 0;
  right: 0;
  height: 1px;
}

.center-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}

.center-line {
  position: absolute;
  background: rgba(212, 168, 83, 0.3);
}

.center-line.vertical {
  top: 0;
  bottom: 0;
  width: 1px;
}

.center-line.horizontal {
  left: 0;
  right: 0;
  height: 1px;
}

.active-guides {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.active-guide {
  position: absolute;
  background: var(--accent);
  box-shadow: 0 0 8px rgba(212, 168, 83, 0.6);
}

.selection-box {
  position: absolute;
  border: 1px dashed var(--accent);
  background: rgba(212, 168, 83, 0.1);
  pointer-events: none;
  z-index: 100;
}

.panning-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(26, 22, 20, 0.9);
  color: var(--accent);
  border-radius: 9999px;
  font-size: 0.85rem;
  pointer-events: none;
  z-index: 1000;
}

.canvas-hint {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(26, 22, 20, 0.7);
  color: var(--text-secondary);
  border-radius: 9999px;
  font-size: 0.7rem;
  pointer-events: none;
  z-index: 100;
}
</style>
