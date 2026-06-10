<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Upload, RotateCw } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { useImageFilter } from '@/composables/useImageFilter'
import { mmToPx } from '@/lib/unitConversion'
import type { PrintImage } from '@/types'

const props = defineProps<{
  image: PrintImage
  isSelected: boolean
  scale: number
  dpi: number
}>()

const emit = defineEmits<{
  dragStart: [imageId: string, handleType: string]
  doubleClick: [imageId: string]
  select: [imageId: string, multiSelect: boolean]
}>()

const printLayoutStore = usePrintLayoutStore()
const { isCropping, croppingImageId } = storeToRefs(printLayoutStore)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const imageSrc = computed(() => props.image.src || null)
const filterParams = computed(() => props.image.filterParams)

const { isProcessing } = useImageFilter(canvasRef, imageSrc, filterParams)

const handleSize = 8
const controlPointSize = computed(() => Math.max(handleSize, handleSize / props.scale))

const isCurrentCropping = computed(() =>
  isCropping.value && croppingImageId.value === props.image.id
)

const imageStyle = computed(() => {
  const x = mmToPx(props.image.x, props.dpi)
  const y = mmToPx(props.image.y, props.dpi)
  const width = mmToPx(props.image.width, props.dpi)
  const height = mmToPx(props.image.height, props.dpi)
  const rotation = props.image.rotation

  return {
    width: `${width}px`,
    height: `${height}px`,
    transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    zIndex: props.image.zIndex,
  }
})

const innerImageStyle = computed(() => {
  const border = props.image.border
  const crop = props.image.crop

  const styles: Record<string, string> = {}

  if (crop) {
    const cropX = (crop.x / props.image.originalWidth) * 100
    const cropY = (crop.y / props.image.originalHeight) * 100
    const cropWidth = (crop.width / props.image.originalWidth) * 100
    const cropHeight = (crop.height / props.image.originalHeight) * 100
    styles.objectPosition = `${-cropX}% ${-cropY}%`
    styles.objectFit = 'cover'
    styles.width = `${100 / (cropWidth / 100)}%`
    styles.height = `${100 / (cropHeight / 100)}%`
    styles.transform = `translate(${cropX}%, ${cropY}%)`
  }

  if (border) {
    styles.borderRadius = `${border.borderRadius}px`
  }

  return styles
})

const borderStyle = computed(() => {
  const border = props.image.border
  if (!border) return {}

  const styles: Record<string, string> = {}
  styles.border = `${border.width}px solid ${border.color}`
  styles.borderRadius = `${border.borderRadius}px`

  if (border.shadow) {
    const { offsetX, offsetY, blur, color, opacity } = border.shadow
    styles.boxShadow = `${offsetX}px ${offsetY}px ${blur}px ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`
  }

  return styles
})

const controlPoints = [
  { name: 'top-left', cursor: 'nwse-resize', top: 0, left: 0 },
  { name: 'top-center', cursor: 'ns-resize', top: 0, left: '50%' },
  { name: 'top-right', cursor: 'nesw-resize', top: 0, right: 0 },
  { name: 'middle-right', cursor: 'ew-resize', top: '50%', right: 0 },
  { name: 'bottom-right', cursor: 'nwse-resize', bottom: 0, right: 0 },
  { name: 'bottom-center', cursor: 'ns-resize', bottom: 0, left: '50%' },
  { name: 'bottom-left', cursor: 'nesw-resize', bottom: 0, left: 0 },
  { name: 'middle-left', cursor: 'ew-resize', top: '50%', left: 0 },
]

function onMouseDown(e: MouseEvent, handleType: string) {
  e.preventDefault()
  e.stopPropagation()
  emit('dragStart', props.image.id, handleType)
}

function onTouchStart(e: TouchEvent, handleType: string) {
  e.preventDefault()
  e.stopPropagation()
  emit('dragStart', props.image.id, handleType)
}

function onClick(e: MouseEvent) {
  e.stopPropagation()
  emit('select', props.image.id, e.shiftKey)
}

function onDoubleClick(e: MouseEvent) {
  e.stopPropagation()
  emit('doubleClick', props.image.id)
}
</script>

<template>
  <div
    class="image-item"
    :class="{
      'is-selected': isSelected,
      'is-cropping': isCurrentCropping,
      'has-image': image.src,
    }"
    :style="imageStyle"
    @click="onClick"
    @dblclick="onDoubleClick"
    @mousedown="onMouseDown($event, 'move')"
    @touchstart="onTouchStart($event, 'move')"
  >
    <div class="image-content" :style="borderStyle">
      <div v-if="!image.src" class="image-placeholder">
        <Upload :size="32" class="placeholder-icon" />
        <span class="placeholder-text">{{ image.name }}</span>
      </div>

      <canvas
        v-else
        ref="canvasRef"
        class="image-canvas"
        :style="innerImageStyle"
      />

      <div v-if="isProcessing" class="processing-overlay">
        <div class="processing-spinner"></div>
      </div>
    </div>

    <template v-if="isSelected && !isCurrentCropping">
      <div
        v-for="point in controlPoints"
        :key="point.name"
        class="control-point"
        :class="point.name"
        :style="{
          width: controlPointSize + 'px',
          height: controlPointSize + 'px',
          top: point.top,
          left: point.left,
          right: point.right,
          bottom: point.bottom,
          cursor: point.cursor,
        }"
        @mousedown.stop="onMouseDown($event, point.name)"
        @touchstart.stop="onTouchStart($event, point.name)"
      />

      <div
        class="rotate-handle"
        @mousedown.stop="onMouseDown($event, 'rotate')"
        @touchstart.stop="onTouchStart($event, 'rotate')"
      >
        <div class="rotate-line"></div>
        <div class="rotate-icon">
          <RotateCw :size="14" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.image-item {
  position: absolute;
  box-sizing: border-box;
  user-select: none;
  transition: transform 0.1s ease;
}

.image-item:hover:not(.is-cropping) {
  z-index: 9999 !important;
}

.image-item:hover .image-content {
  transform: scale(1.01);
}

.image-content {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-secondary);
  transition: transform 0.2s ease;
}

.image-item.is-selected .image-content::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid var(--accent);
  pointer-events: none;
  z-index: 10;
  box-sizing: border-box;
}

.image-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 2px dashed var(--border-color);
  background: var(--bg-secondary);
}

.placeholder-icon {
  color: var(--text-secondary);
  opacity: 0.5;
}

.placeholder-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.image-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.processing-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.processing-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--accent);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.control-point {
  position: absolute;
  background: var(--bg-primary);
  border: 2px solid var(--accent);
  border-radius: 2px;
  transform: translate(-50%, -50%);
  z-index: 100;
  transition: transform 0.15s ease;
}

.control-point:hover {
  transform: translate(-50%, -50%) scale(1.3);
  background: var(--accent);
}

.control-point.top-left { transform: translate(-50%, -50%); }
.control-point.top-center { transform: translate(-50%, -50%); }
.control-point.top-right { transform: translate(50%, -50%); }
.control-point.top-right:hover { transform: translate(50%, -50%) scale(1.3); }
.control-point.middle-right { transform: translate(50%, -50%); }
.control-point.middle-right:hover { transform: translate(50%, -50%) scale(1.3); }
.control-point.bottom-right { transform: translate(50%, 50%); }
.control-point.bottom-right:hover { transform: translate(50%, 50%) scale(1.3); }
.control-point.bottom-center { transform: translate(-50%, 50%); }
.control-point.bottom-center:hover { transform: translate(-50%, 50%) scale(1.3); }
.control-point.bottom-left { transform: translate(-50%, 50%); }
.control-point.bottom-left:hover { transform: translate(-50%, 50%) scale(1.3); }
.control-point.middle-left { transform: translate(-50%, -50%); }
.control-point.middle-left:hover { transform: translate(-50%, -50%) scale(1.3); }

.rotate-handle {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  z-index: 100;
}

.rotate-handle:active {
  cursor: grabbing;
}

.rotate-line {
  width: 2px;
  height: 20px;
  background: var(--accent);
}

.rotate-icon {
  width: 24px;
  height: 24px;
  background: var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-primary);
  transition: transform 0.15s ease;
  box-shadow: 0 2px 8px rgba(212, 168, 83, 0.4);
}

.rotate-handle:hover .rotate-icon {
  transform: scale(1.2);
  box-shadow: 0 0 16px rgba(212, 168, 83, 0.6);
}

.image-item.is-cropping .control-point,
.image-item.is-cropping .rotate-handle {
  display: none;
}
</style>
