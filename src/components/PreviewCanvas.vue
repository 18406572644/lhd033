<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { Camera, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'
import { useImageFilter } from '@/composables/useImageFilter'

const editorStore = useEditorStore()
const { originalImage, params, comparePosition } = storeToRefs(editorStore)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)

const { isProcessing } = useImageFilter(canvasRef, originalImage, params)

let dragStartX = 0
let dragStartPos = 50

function onDividerDown(e: MouseEvent | TouchEvent) {
  e.preventDefault()
  isDragging.value = true
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  dragStartX = clientX
  dragStartPos = comparePosition.value

  const onMove = (ev: MouseEvent | TouchEvent) => {
    const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
    const container = containerRef.value
    if (!container) return
    const width = container.clientWidth
    const delta = cx - dragStartX
    const pct = dragStartPos + (delta / width) * 100
    editorStore.comparePosition = Math.max(0, Math.min(100, pct))
  }

  const onUp = () => {
    isDragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    window.removeEventListener('touchmove', onMove)
    window.removeEventListener('touchend', onUp)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
  window.addEventListener('touchmove', onMove, { passive: true })
  window.addEventListener('touchend', onUp)
}

const comparePos = computed(() => comparePosition.value)
</script>

<template>
  <div v-if="!editorStore.hasImage" class="preview-placeholder film-border vignette">
    <Camera :size="48" class="placeholder-icon" />
    <p class="placeholder-text">上传图片开始调色</p>
    <p class="placeholder-sub">选择一张照片，体验胶卷滤镜的魔力</p>
  </div>

  <div v-else ref="containerRef" class="preview-container film-border vignette">
    <div class="compare-wrapper">
      <img
        :src="originalImage!"
        class="compare-image compare-original"
        :style="{ clipPath: `inset(0 ${100 - comparePos}% 0 0)` }"
        alt="原图"
      />
      <canvas
        ref="canvasRef"
        class="compare-image compare-filtered"
        :style="{ clipPath: `inset(0 0 0 ${comparePos}%)` }"
      />

      <div
        class="compare-divider"
        :style="{ left: comparePos + '%' }"
        @mousedown="onDividerDown"
        @touchstart="onDividerDown"
      >
        <div class="divider-line"></div>
        <div class="divider-handle">
          <ChevronLeft :size="12" />
          <ChevronRight :size="12" />
        </div>
      </div>
    </div>

    <div class="compare-labels">
      <span
        class="label-badge label-original"
        :style="{ opacity: comparePos > 10 ? 1 : 0 }"
      >原图</span>
      <span
        class="label-badge label-effect"
        :style="{ opacity: comparePos < 90 ? 1 : 0 }"
      >效果</span>
    </div>

    <div v-if="isProcessing" class="processing-indicator">
      <span class="processing-dot"></span>
    </div>
  </div>
</template>

<style scoped>
.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 400px;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 3rem;
}

.placeholder-icon {
  color: var(--text-secondary);
  opacity: 0.5;
}

.placeholder-text {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.placeholder-sub {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
  margin: 0;
}

.preview-container {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: var(--bg-secondary);
}

.compare-wrapper {
  position: relative;
  width: 100%;
  overflow: hidden;
  line-height: 0;
}

.compare-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 65vh;
  object-fit: contain;
  background: var(--bg-secondary);
}

.compare-original {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.compare-filtered {
  position: relative;
  z-index: 1;
}

.compare-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 10;
  transform: translateX(-50%);
  cursor: ew-resize;
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider-line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: var(--accent);
  box-shadow: 0 0 8px rgba(212, 168, 83, 0.5);
}

.divider-handle {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 2px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #1A1614;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  justify-content: center;
}

.divider-handle:hover {
  transform: scale(1.15);
  box-shadow: 0 0 16px rgba(212, 168, 83, 0.5);
}

.compare-labels {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 5;
  pointer-events: none;
}

.label-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: opacity 0.3s ease;
}

.label-original {
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
}

.label-effect {
  background: rgba(212, 168, 83, 0.8);
  color: #1A1614;
}

.processing-indicator {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 10;
}

.processing-dot {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
</style>
