<script setup lang="ts">
import { computed, ref } from 'vue'
import { Upload, RotateCw } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { mmToPx } from '@/lib/unitConversion'
import type { PrintImage } from '@/types'

const props = defineProps<{
  image: PrintImage
  isSelected: boolean
  scale: number
  dpi: number
}>()

const emit = defineEmits<{
  dragStart: [e: MouseEvent | TouchEvent, handleType: string]
  doubleClick: [e: MouseEvent | TouchEvent]
  select: [imageId: string, multiSelect: boolean]
}>()

const printLayoutStore = usePrintLayoutStore()
const { isCropping, croppingImageId } = storeToRefs(printLayoutStore)

const imgRef = ref<HTMLImageElement | null>(null)
const imageLoaded = ref(false)
const imageError = ref(false)

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
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    transform: `rotate(${rotation}deg)`,
    transformOrigin: 'center center',
    zIndex: props.image.zIndex,
  }
})

const filterStyle = computed(() => {
  const p = props.image.filterParams
  const filters: string[] = []

  if (p.brightness !== 100) {
    filters.push(`brightness(${p.brightness}%)`)
  }
  if (p.contrast !== 100) {
    filters.push(`contrast(${p.contrast}%)`)
  }
  if (p.saturate !== 100) {
    filters.push(`saturate(${p.saturate}%)`)
  }
  if (p.sepia !== 0) {
    filters.push(`sepia(${p.sepia}%)`)
  }
  if (p.hueRotate !== 0) {
    filters.push(`hue-rotate(${p.hueRotate}deg)`)
  }

  return filters.length > 0 ? filters.join(' ') : 'none'
})

const temperatureOverlay = computed(() => {
  const temp = props.image.filterParams.temperature
  if (temp === 0) return null
  const opacity = Math.abs(temp) / 200
  const color = temp > 0 ? 'rgba(255, 150, 50,' : 'rgba(50, 100, 255,'
  return `${color}${opacity})`
})

const grainOpacity = computed(() => {
  return props.image.filterParams.grain / 150
})

const cropStyle = computed(() => {
  const crop = props.image.crop
  if (!crop) return {}

  const scaleX = 1 / crop.width
  const scaleY = 1 / crop.height
  const translateX = -crop.x * 100 * scaleX
  const translateY = -crop.y * 100 * scaleY

  return {
    transform: `scale(${scaleX}, ${scaleY}) translate(${translateX / scaleX}%, ${translateY / scaleY}%)`,
    transformOrigin: 'top left',
    width: `${100 / crop.width}%`,
    height: `${100 / crop.height}%`,
  }
})

const borderStyle = computed(() => {
  const border = props.image.border
  if (!border) return {}

  const styles: Record<string, string> = {}
  const borderWidthPx = mmToPx(border.width, props.dpi)
  const borderRadiusPx = mmToPx(border.borderRadius, props.dpi)

  styles.border = `${borderWidthPx}px solid ${border.color}`
  styles.borderRadius = `${borderRadiusPx}px`

  if (border.shadow) {
    const { offsetX, offsetY, blur, color, opacity } = border.shadow
    const ox = mmToPx(offsetX, props.dpi)
    const oy = mmToPx(offsetY, props.dpi)
    const b = mmToPx(blur, props.dpi)
    const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0')
    styles.boxShadow = `${ox}px ${oy}px ${b}px ${color}${alpha}`
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
  emit('dragStart', e, handleType)
}

function onTouchStart(e: TouchEvent, handleType: string) {
  e.preventDefault()
  e.stopPropagation()
  emit('dragStart', e, handleType)
}

function onClick(e: MouseEvent) {
  e.stopPropagation()
  emit('select', props.image.id, e.shiftKey)
}

function onDoubleClick(e: MouseEvent) {
  e.stopPropagation()
  emit('doubleClick', e)
}

function handleImageLoad() {
  imageLoaded.value = true
  imageError.value = false
}

function handleImageError() {
  imageLoaded.value = false
  imageError.value = true
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
      <div v-if="!image.src || imageError" class="image-placeholder">
        <Upload :size="32" class="placeholder-icon" />
        <span class="placeholder-text">{{ image.name }}</span>
      </div>

      <div v-else class="image-wrapper">
        <img
          ref="imgRef"
          :src="image.src"
          :alt="image.name"
          class="image-img"
          :style="{ ...cropStyle, filter: filterStyle }"
          @load="handleImageLoad"
          @error="handleImageError"
          draggable="false"
        />

        <div
          v-if="temperatureOverlay"
          class="temperature-overlay"
          :style="{ backgroundColor: temperatureOverlay }"
        />

        <div
          v-if="grainOpacity > 0"
          class="grain-overlay"
          :style="{ opacity: grainOpacity }"
        />
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
  transition: box-shadow 0.2s ease;
}

.image-item:hover:not(.is-cropping) {
  z-index: 9999 !important;
}

.image-content {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-secondary);
  box-sizing: border-box;
}

.image-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.image-img {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  user-select: none;
  -webkit-user-drag: none;
}

.temperature-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: soft-light;
}

.grain-overlay {
  position: absolute;
  inset: -50%;
  width: 200%;
  height: 200%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 128px 128px;
  pointer-events: none;
  mix-blend-mode: overlay;
  animation: grain-move 2s steps(10) infinite;
}

@keyframes grain-move {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-10%, -10%); }
  50% { transform: translate(5%, -15%); }
  75% { transform: translate(-5%, 10%); }
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
