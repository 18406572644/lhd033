<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import type { CurvePoint, RGBCurves } from '@/types'

const props = defineProps<{
  modelValue: RGBCurves
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: RGBCurves): void
  (e: 'change'): void
}>()

const activeChannel = ref<'r' | 'g' | 'b'>('r')
const canvasRef = ref<HTMLCanvasElement | null>(null)
const draggingIndex = ref<number | null>(null)

const CANVAS_SIZE = 200
const PADDING = 0

const channelLabels: Record<string, string> = { r: 'R', g: 'G', b: 'B' }
const channelColors: Record<string, string> = { r: '#ef4444', g: '#22c55e', b: '#3b82f6' }

const currentPoints = computed(() => {
  return props.modelValue[activeChannel.value]
})

function valToCanvas(val: number): number {
  return CANVAS_SIZE - (val / 255) * CANVAS_SIZE
}

function canvasToVal(pos: number): number {
  return Math.round(((CANVAS_SIZE - pos) / CANVAS_SIZE) * 255)
}

function drawCurve() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  canvas.width = CANVAS_SIZE * dpr
  canvas.height = CANVAS_SIZE * dpr
  canvas.style.width = CANVAS_SIZE + 'px'
  canvas.style.height = CANVAS_SIZE + 'px'
  ctx.scale(dpr, dpr)

  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  ctx.fillStyle = 'var(--bg-secondary, #1e1e1e)'
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) {
    const pos = (CANVAS_SIZE / 4) * i
    ctx.beginPath()
    ctx.moveTo(pos, 0)
    ctx.lineTo(pos, CANVAS_SIZE)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, pos)
    ctx.lineTo(CANVAS_SIZE, pos)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, CANVAS_SIZE)
  ctx.lineTo(CANVAS_SIZE, 0)
  ctx.stroke()

  const channels: ('r' | 'g' | 'b')[] = ['r', 'g', 'b']
  channels.forEach(ch => {
    const points = props.modelValue[ch]
    if (points.length < 2) return

    const sorted = [...points].sort((a, b) => a.x - b.x)
    const isActive = ch === activeChannel.value
    const color = channelColors[ch]

    ctx.strokeStyle = isActive ? color : `${color}33`
    ctx.lineWidth = isActive ? 2 : 1
    ctx.beginPath()

    const steps = 100
    for (let s = 0; s <= steps; s++) {
      const input = (s / steps) * 255
      const output = interpolateFromPoints(sorted, input)
      const cx2 = (input / 255) * CANVAS_SIZE
      const cy2 = valToCanvas(output)
      if (s === 0) ctx.moveTo(cx2, cy2)
      else ctx.lineTo(cx2, cy2)
    }
    ctx.stroke()

    if (isActive) {
      sorted.forEach((pt) => {
        const cx2 = (pt.x / 255) * CANVAS_SIZE
        const cy2 = valToCanvas(pt.y)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(cx2, cy2, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1.5
        ctx.stroke()
      })
    }
  })
}

function interpolateFromPoints(sorted: CurvePoint[], input: number): number {
  if (sorted.length === 0) return input
  if (sorted.length === 1) return sorted[0].y
  if (input <= sorted[0].x) return sorted[0].y
  if (input >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y

  let lo = 0
  let hi = sorted.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].x <= input) lo = mid
    else hi = mid
  }

  const p0 = sorted[lo]
  const p1 = sorted[hi]
  const t = (input - p0.x) / (p1.x - p0.x)
  return p0.y + (p1.y - p0.y) * t
}

function getPointAtPos(canvasX: number, canvasY: number): number | null {
  const points = currentPoints.value
  const threshold = 12
  for (let i = 0; i < points.length; i++) {
    const px = (points[i].x / 255) * CANVAS_SIZE
    const py = valToCanvas(points[i].y)
    const dist = Math.sqrt((canvasX - px) ** 2 + (canvasY - py) ** 2)
    if (dist < threshold) return i
  }
  return null
}

function getCanvasPos(e: MouseEvent | TouchEvent) {
  const canvas = canvasRef.value
  if (!canvas) return { x: 0, y: 0 }
  const rect = canvas.getBoundingClientRect()
  const scaleX = CANVAS_SIZE / rect.width
  const scaleY = CANVAS_SIZE / rect.height
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  }
}

function onPointerDown(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  const pos = getCanvasPos(e)
  const hitIndex = getPointAtPos(pos.x, pos.y)

  if (hitIndex !== null) {
    draggingIndex.value = hitIndex
  } else {
    const newX = canvasToVal(pos.x)
    const newY = canvasToVal(pos.y)
    const ch = activeChannel.value
    const newPoints = [...props.modelValue[ch], { x: newX, y: newY }].sort((a, b) => a.x - b.x)
    const newCurves = { ...props.modelValue, [ch]: newPoints }
    emit('update:modelValue', newCurves)
    draggingIndex.value = newPoints.findIndex(p => p.x === newX && p.y === newY)
    drawCurve()
  }

  const onMove = (ev: MouseEvent | TouchEvent) => {
    if (draggingIndex.value === null) return
    ev.preventDefault()
    const pos2 = getCanvasPos(ev)
    const newX = Math.max(0, Math.min(255, canvasToVal(pos2.x)))
    const newY = Math.max(0, Math.min(255, canvasToVal(pos2.y)))

    const ch = activeChannel.value
    const points = [...props.modelValue[ch]]

    if (draggingIndex.value === 0) {
      points[0] = { x: 0, y: newY }
    } else if (draggingIndex.value === points.length - 1) {
      points[points.length - 1] = { x: 255, y: newY }
    } else {
      const minX = points[draggingIndex.value! - 1].x + 1
      const maxX = points[draggingIndex.value! + 1].x - 1
      points[draggingIndex.value!] = {
        x: Math.max(minX, Math.min(maxX, newX)),
        y: newY,
      }
    }

    const newCurves = { ...props.modelValue, [ch]: points }
    emit('update:modelValue', newCurves)
    drawCurve()
  }

  const onUp = () => {
    draggingIndex.value = null
    emit('change')
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchmove', onMove, { passive: false })
  window.addEventListener('touchend', onUp)
}

function onDoubleClick(e: MouseEvent) {
  const pos = getCanvasPos(e)
  const hitIndex = getPointAtPos(pos.x, pos.y)
  if (hitIndex === null) return

  const ch = activeChannel.value
  const points = [...props.modelValue[ch]]
  if (hitIndex === 0 || hitIndex === points.length - 1) return

  points.splice(hitIndex, 1)
  const newCurves = { ...props.modelValue, [ch]: points }
  emit('update:modelValue', newCurves)
  emit('change')
  drawCurve()
}

function resetChannel() {
  const ch = activeChannel.value
  const defaultPts: CurvePoint[] = [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }]
  const newCurves = { ...props.modelValue, [ch]: defaultPts }
  emit('update:modelValue', newCurves)
  emit('change')
  drawCurve()
}

watch(() => props.modelValue, () => {
  drawCurve()
}, { deep: true })

watch(activeChannel, () => {
  drawCurve()
})

onMounted(() => {
  drawCurve()
})
</script>

<template>
  <div class="curve-editor">
    <div class="curve-channel-tabs">
      <button
        v-for="ch in (['r', 'g', 'b'] as const)"
        :key="ch"
        class="curve-channel-btn"
        :class="{ 'curve-channel-btn--active': activeChannel === ch }"
        :style="{ '--ch-color': channelColors[ch] }"
        @click="activeChannel = ch"
      >
        {{ channelLabels[ch] }}
      </button>
      <button class="curve-reset-btn" @click="resetChannel" title="重置当前通道">↺</button>
    </div>
    <div class="curve-canvas-wrap">
      <canvas
        ref="canvasRef"
        class="curve-canvas"
        @mousedown="onPointerDown"
        @touchstart="onPointerDown"
        @dblclick="onDoubleClick"
      />
    </div>
    <div class="curve-hint">双击控制点删除 · 点击空白添加</div>
  </div>
</template>

<style scoped>
.curve-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.curve-channel-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.curve-channel-btn {
  flex: 1;
  padding: 4px 0;
  font-size: 0.72rem;
  font-weight: 600;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.curve-channel-btn--active {
  background: color-mix(in srgb, var(--ch-color) 15%, transparent);
  border-color: var(--ch-color);
  color: var(--ch-color);
}

.curve-channel-btn:hover:not(.curve-channel-btn--active) {
  color: var(--text-primary);
  border-color: var(--text-secondary);
}

.curve-reset-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.curve-reset-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.curve-canvas-wrap {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.curve-canvas {
  display: block;
  cursor: crosshair;
  width: 100%;
  height: auto;
  aspect-ratio: 1;
}

.curve-hint {
  font-size: 0.62rem;
  color: var(--text-secondary);
  text-align: center;
  opacity: 0.7;
}
</style>
