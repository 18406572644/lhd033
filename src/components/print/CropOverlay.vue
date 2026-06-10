<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { mmToPx } from '@/lib/unitConversion'
import { Check, X, RotateCw, FlipHorizontal, FlipVertical } from 'lucide-vue-next'
import type { PrintImage } from '@/types'

const props = defineProps<{
  image: PrintImage
  dpi: number
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const store = usePrintLayoutStore()
const { zoom } = storeToRefs(store)

const overlayRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const isResizing = ref(false)
const resizeHandle = ref<string | null>(null)
const dragStart = ref({ x: 0, y: 0, cropX: 0, cropY: 0 })
const resizeStart = ref({ x: 0, y: 0, cropX: 0, cropY: 0, cropW: 0, cropH: 0 })

const imageStyle = computed(() => {
  const width = mmToPx(props.image.width, props.dpi)
  const height = mmToPx(props.image.height, props.dpi)
  return {
    width: `${width}px`,
    height: `${height}px`,
  }
})

const cropBoxStyle = computed(() => {
  const crop = props.image.crop
  const width = mmToPx(props.image.width, props.dpi)
  const height = mmToPx(props.image.height, props.dpi)

  if (!crop) {
    return {
      left: '0px',
      top: '0px',
      width: `${width}px`,
      height: `${height}px`,
    }
  }

  return {
    left: `${crop.x * width}px`,
    top: `${crop.y * height}px`,
    width: `${crop.width * width}px`,
    height: `${crop.height * height}px`,
  }
})

const handleSize = computed(() => Math.max(8, 8 / zoom.value))

const resizeHandles = [
  { name: 'nw', cursor: 'nwse-resize', top: 0, left: 0 },
  { name: 'ne', cursor: 'nesw-resize', top: 0, right: 0 },
  { name: 'sw', cursor: 'nesw-resize', bottom: 0, left: 0 },
  { name: 'se', cursor: 'nwse-resize', bottom: 0, right: 0 },
  { name: 'n', cursor: 'ns-resize', top: 0, left: '50%' },
  { name: 's', cursor: 'ns-resize', bottom: 0, left: '50%' },
  { name: 'w', cursor: 'ew-resize', top: '50%', left: 0 },
  { name: 'e', cursor: 'ew-resize', top: '50%', right: 0 },
]

function onCropMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.resize-handle')) return
  e.preventDefault()
  e.stopPropagation()

  const crop = props.image.crop
  if (!crop) return

  isDragging.value = true
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    cropX: crop.x,
    cropY: crop.y,
  }

  window.addEventListener('mousemove', onCropMouseMove)
  window.addEventListener('mouseup', onCropMouseUp)
}

function onCropMouseMove(e: MouseEvent) {
  if (!isDragging.value) return
  e.preventDefault()

  const width = mmToPx(props.image.width, props.dpi)
  const height = mmToPx(props.image.height, props.dpi)

  const dx = (e.clientX - dragStart.value.x) / width
  const dy = (e.clientY - dragStart.value.y) / height

  let newX = dragStart.value.cropX + dx
  let newY = dragStart.value.cropY + dy

  const crop = props.image.crop
  if (!crop) return

  newX = Math.max(0, Math.min(1 - crop.width, newX))
  newY = Math.max(0, Math.min(1 - crop.height, newY))

  store.updateImageCrop(props.image.id, {
    ...crop,
    x: newX,
    y: newY,
  })
}

function onCropMouseUp() {
  isDragging.value = false
  window.removeEventListener('mousemove', onCropMouseMove)
  window.removeEventListener('mouseup', onCropMouseUp)
}

function onResizeMouseDown(e: MouseEvent, handle: string) {
  e.preventDefault()
  e.stopPropagation()

  const crop = props.image.crop
  if (!crop) return

  isResizing.value = true
  resizeHandle.value = handle
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    cropX: crop.x,
    cropY: crop.y,
    cropW: crop.width,
    cropH: crop.height,
  }

  window.addEventListener('mousemove', onResizeMouseMove)
  window.addEventListener('mouseup', onResizeMouseUp)
}

function onResizeMouseMove(e: MouseEvent) {
  if (!isResizing.value || !resizeHandle.value) return
  e.preventDefault()

  const width = mmToPx(props.image.width, props.dpi)
  const height = mmToPx(props.image.height, props.dpi)
  const handle = resizeHandle.value

  let { cropX, cropY, cropW, cropH } = resizeStart.value
  const dx = (e.clientX - resizeStart.value.x) / width
  const dy = (e.clientY - resizeStart.value.y) / height

  if (handle.includes('e')) {
    cropW = Math.max(0.05, Math.min(1 - cropX, resizeStart.value.cropW + dx))
  }
  if (handle.includes('w')) {
    const newW = Math.max(0.05, resizeStart.value.cropW - dx)
    const maxX = resizeStart.value.cropX + resizeStart.value.cropW - 0.05
    cropX = Math.min(maxX, resizeStart.value.cropX + dx)
    cropW = newW
    if (cropX + cropW > 1) {
      cropW = 1 - cropX
    }
  }
  if (handle.includes('s')) {
    cropH = Math.max(0.05, Math.min(1 - cropY, resizeStart.value.cropH + dy))
  }
  if (handle.includes('n')) {
    const newH = Math.max(0.05, resizeStart.value.cropH - dy)
    const maxY = resizeStart.value.cropY + resizeStart.value.cropH - 0.05
    cropY = Math.min(maxY, resizeStart.value.cropY + dy)
    cropH = newH
    if (cropY + cropH > 1) {
      cropH = 1 - cropY
    }
  }

  if (e.shiftKey) {
    const aspectRatio = resizeStart.value.cropW / resizeStart.value.cropH
    if (Math.abs(dx) > Math.abs(dy)) {
      cropH = cropW / aspectRatio
    } else {
      cropW = cropH * aspectRatio
    }
  }

  store.updateImageCrop(props.image.id, {
    x: cropX,
    y: cropY,
    width: cropW,
    height: cropH,
  })
}

function onResizeMouseUp() {
  isResizing.value = false
  resizeHandle.value = null
  window.removeEventListener('mousemove', onResizeMouseMove)
  window.removeEventListener('mouseup', onResizeMouseUp)
}

function confirmCrop() {
  store.stopCropping()
  emit('confirm')
}

function cancelCrop() {
  store.stopCropping()
  emit('cancel')
}

function resetCrop() {
  store.updateImageCrop(props.image.id, null)
}

function initCrop() {
  if (!props.image.crop) {
    store.updateImageCrop(props.image.id, {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    })
  }
}

onMounted(() => {
  initCrop()
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onCropMouseMove)
  window.removeEventListener('mouseup', onCropMouseUp)
  window.removeEventListener('mousemove', onResizeMouseMove)
  window.removeEventListener('mouseup', onResizeMouseUp)
})
</script>

<template>
  <div ref="overlayRef" class="crop-overlay" :style="imageStyle">
    <div class="crop-mask left" :style="{ width: cropBoxStyle.left }" />
    <div class="crop-mask right" :style="{ left: `calc(${cropBoxStyle.left} + ${cropBoxStyle.width})` }" />
    <div
      class="crop-mask top"
      :style="{
        left: cropBoxStyle.left,
        width: cropBoxStyle.width,
        height: cropBoxStyle.top,
      }"
    />
    <div
      class="crop-mask bottom"
      :style="{
        left: cropBoxStyle.left,
        top: `calc(${cropBoxStyle.top} + ${cropBoxStyle.height})`,
        width: cropBoxStyle.width,
      }"
    />

    <div
      class="crop-box"
      :style="cropBoxStyle"
      @mousedown="onCropMouseDown"
    >
      <div class="crop-grid">
        <div class="grid-line v1" />
        <div class="grid-line v2" />
        <div class="grid-line h1" />
        <div class="grid-line h2" />
      </div>

      <div
        v-for="handle in resizeHandles"
        :key="handle.name"
        class="resize-handle"
        :class="handle.name"
        :style="{
          width: handleSize + 'px',
          height: handleSize + 'px',
          top: handle.top,
          left: handle.left,
          right: handle.right,
          bottom: handle.bottom,
          cursor: handle.cursor,
        }"
        @mousedown.stop="onResizeMouseDown($event, handle.name)"
      />
    </div>

    <div class="crop-toolbar">
      <button class="crop-btn" @click="resetCrop" title="重置裁剪">
        <RotateCw :size="16" />
      </button>
      <button class="crop-btn" @click="cancelCrop" title="取消">
        <X :size="16" />
      </button>
      <button class="crop-btn confirm" @click="confirmCrop" title="确认裁剪">
        <Check :size="16" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.crop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1000;
  pointer-events: auto;
}

.crop-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.6);
  pointer-events: none;
}

.crop-mask.left {
  top: 0;
  left: 0;
  height: 100%;
}

.crop-mask.right {
  top: 0;
  right: 0;
  height: 100%;
}

.crop-mask.top {
  top: 0;
}

.crop-mask.bottom {
  bottom: 0;
}

.crop-box {
  position: absolute;
  border: 2px solid var(--accent);
  cursor: move;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0);
  box-sizing: border-box;
}

.crop-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute;
  background: rgba(255, 255, 255, 0.5);
}

.grid-line.v1 {
  left: 33.33%;
  top: 0;
  bottom: 0;
  width: 1px;
}

.grid-line.v2 {
  left: 66.66%;
  top: 0;
  bottom: 0;
  width: 1px;
}

.grid-line.h1 {
  top: 33.33%;
  left: 0;
  right: 0;
  height: 1px;
}

.grid-line.h2 {
  top: 66.66%;
  left: 0;
  right: 0;
  height: 1px;
}

.resize-handle {
  position: absolute;
  background: var(--bg-primary);
  border: 2px solid var(--accent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: transform 0.15s ease;
}

.resize-handle:hover {
  transform: translate(-50%, -50%) scale(1.3);
  background: var(--accent);
}

.resize-handle.n { transform: translate(-50%, -50%); }
.resize-handle.s { transform: translate(-50%, 50%); }
.resize-handle.e { transform: translate(50%, -50%); }
.resize-handle.w { transform: translate(-50%, -50%); }
.resize-handle.nw { transform: translate(-50%, -50%); }
.resize-handle.ne { transform: translate(50%, -50%); }
.resize-handle.sw { transform: translate(-50%, 50%); }
.resize-handle.se { transform: translate(50%, 50%); }

.resize-handle.n:hover { transform: translate(-50%, -50%) scale(1.3); }
.resize-handle.s:hover { transform: translate(-50%, 50%) scale(1.3); }
.resize-handle.e:hover { transform: translate(50%, -50%) scale(1.3); }
.resize-handle.w:hover { transform: translate(-50%, -50%) scale(1.3); }
.resize-handle.nw:hover { transform: translate(-50%, -50%) scale(1.3); }
.resize-handle.ne:hover { transform: translate(50%, -50%) scale(1.3); }
.resize-handle.sw:hover { transform: translate(-50%, 50%) scale(1.3); }
.resize-handle.se:hover { transform: translate(50%, 50%) scale(1.3); }

.crop-toolbar {
  position: absolute;
  bottom: -48px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 6px;
  background: rgba(26, 22, 20, 0.9);
  border-radius: 9999px;
  backdrop-filter: blur(8px);
}

.crop-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.crop-btn:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}

.crop-btn.confirm {
  background: var(--accent);
  color: #1a1614;
}

.crop-btn.confirm:hover {
  background: var(--accent-hover);
  transform: scale(1.1);
}
</style>
