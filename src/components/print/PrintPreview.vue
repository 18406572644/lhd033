<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { storeToRefs } from 'pinia'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { usePrintPreview } from '@/composables/usePrintPreview'
import { usePdfExport } from '@/composables/usePdfExport'
import { Eye, Download, Printer, X, Layers, Droplets, Sun, Scissors, Crop, ChevronDown } from 'lucide-vue-next'
import type { PaperTextureType, InkSimulationType, LightingType } from '@/composables/usePrintPreview'
import type { PrintProject } from '@/types'

const store = usePrintLayoutStore()
const { printPreview, paper, images, projectName } = storeToRefs(store)
const { renderPreview } = usePrintPreview()
const { exporting, progress, exportToPdf, exportToImage, browserPrint } = usePdfExport()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const textureDropdownOpen = ref(false)

const paperTextureOptions: { value: PaperTextureType; label: string; description: string }[] = [
  { value: 'none', label: '无纹理', description: '纯白纸张' },
  { value: 'glossy', label: '光面纸', description: '高光镜面效果' },
  { value: 'matte', label: '绒面纸', description: '磨砂哑光质感' },
  { value: 'fineart', label: '艺术纸', description: '专业美术纹理' },
  { value: 'xuanzhi', label: '宣纸', description: '东方水墨质感' },
]

const inkSimulationOptions: { value: InkSimulationType; label: string; description: string }[] = [
  { value: 'none', label: '无模拟', description: '原始色彩' },
  { value: 'inkjet', label: '喷墨打印', description: '喷墨打印机效果' },
  { value: 'laser', label: '激光打印', description: '激光打印机效果' },
  { value: 'silver', label: '银盐冲印', description: '传统胶片冲印' },
]

const lightingOptions: { value: LightingType; label: string; description: string }[] = [
  { value: 'indoor', label: '室内光', description: '暖色调室内照明' },
  { value: 'window', label: '窗边', description: '冷色调窗外光线' },
  { value: 'sunlight', label: '阳光下', description: '强烈日光照射' },
]

const selectedTexture = computed({
  get: () => printPreview.value.paperTexture as PaperTextureType,
  set: (val: PaperTextureType) => store.setPrintPreview({ paperTexture: val }),
})

const textureIntensity = computed({
  get: () => printPreview.value.textureIntensity,
  set: (val: number) => store.setPrintPreview({ textureIntensity: val }),
})

const inkSimulation = computed({
  get: () => printPreview.value.inkSimulation as InkSimulationType,
  set: (val: InkSimulationType) => store.setPrintPreview({ inkSimulation: val }),
})

const lighting = computed({
  get: () => printPreview.value.lighting as LightingType,
  set: (val: LightingType) => store.setPrintPreview({ lighting: val }),
})

const showBleed = computed({
  get: () => printPreview.value.showBleed,
  set: (val: boolean) => store.setPrintPreview({ showBleed: val }),
})

const showCropMarks = computed({
  get: () => printPreview.value.showCropMarks,
  set: (val: boolean) => store.setPrintPreview({ showCropMarks: val }),
})

const previewScale = computed(() => {
  if (!containerRef.value) return 0.3
  const containerWidth = containerRef.value.clientWidth - 48
  const containerHeight = containerRef.value.clientHeight - 80

  const paperWidthMm = paper.value.orientation === 'landscape' ? paper.value.size.height : paper.value.size.width
  const paperHeightMm = paper.value.orientation === 'landscape' ? paper.value.size.width : paper.value.size.height

  const bleedSize = printPreview.value.bleedSize
  const totalWidthMm = paperWidthMm + bleedSize * 2
  const totalHeightMm = paperHeightMm + bleedSize * 2

  const widthScale = containerWidth / (totalWidthMm * (paper.value.dpi / 25.4))
  const heightScale = containerHeight / (totalHeightMm * (paper.value.dpi / 25.4))

  return Math.min(widthScale, heightScale, 1)
})

const currentProject = computed<PrintProject>(() => ({
  id: store.projectId || 'temp',
  name: projectName.value,
  createdAt: new Date().toISOString(),
  paper: paper.value,
  images: images.value,
}))

async function updatePreview() {
  if (!canvasRef.value) return
  await nextTick()
  await renderPreview(
    canvasRef.value,
    currentProject.value,
    printPreview.value,
    { scale: previewScale.value }
  )
}

function selectTexture(val: PaperTextureType) {
  selectedTexture.value = val
  textureDropdownOpen.value = false
}

function handleExportPdf() {
  exportToPdf(currentProject.value, printPreview.value, {
    includeCropMarks: showCropMarks.value,
  })
}

function handleExportImage(format: 'jpg' | 'png') {
  exportToImage(currentProject.value, printPreview.value, format)
}

function handleBrowserPrint() {
  browserPrint(currentProject.value)
}

function closeModal() {
  store.togglePreviewModal()
}

function handleOverlayClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    closeModal()
  }
}

watch(
  [
    () => printPreview.value,
    () => currentProject.value,
    () => previewScale.value,
  ],
  () => {
    updatePreview()
  },
  { deep: true }
)

onMounted(() => {
  updatePreview()
})
</script>

<template>
  <div
    class="preview-modal-overlay"
    @click="handleOverlayClick"
  >
    <div class="preview-modal">
      <div class="modal-header">
        <div class="header-title">
          <Eye :size="20" class="title-icon" />
          <span>打印预览</span>
        </div>
        <button class="close-btn" @click="closeModal" title="关闭">
          <X :size="20" />
        </button>
      </div>

      <div class="modal-body">
        <div class="settings-panel">
          <div class="settings-section">
            <div class="section-title">
              <Layers :size="16" class="section-icon" />
              <span>纸张纹理</span>
            </div>
            <div class="texture-dropdown" :class="{ 'is-open': textureDropdownOpen }">
              <button
                class="dropdown-trigger"
                @click="textureDropdownOpen = !textureDropdownOpen"
              >
                <span class="selected-label">
                  {{ paperTextureOptions.find(o => o.value === selectedTexture)?.label }}
                </span>
                <ChevronDown :size="16" class="dropdown-arrow" />
              </button>
              <div class="dropdown-menu" v-if="textureDropdownOpen">
                <button
                  v-for="opt in paperTextureOptions"
                  :key="opt.value"
                  class="dropdown-item"
                  :class="{ 'is-selected': selectedTexture === opt.value }"
                  @click="selectTexture(opt.value)"
                >
                  <span class="item-label">{{ opt.label }}</span>
                  <span class="item-desc">{{ opt.description }}</span>
                </button>
              </div>
            </div>
            <div class="slider-group" v-if="selectedTexture !== 'none'">
              <div class="slider-label">
                <span>纹理强度</span>
                <span class="slider-value">{{ textureIntensity }}%</span>
              </div>
              <input
                type="range"
                class="param-slider"
                min="0"
                max="100"
                step="1"
                v-model.number="textureIntensity"
              />
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">
              <Droplets :size="16" class="section-icon" />
              <span>墨色模拟</span>
            </div>
            <div class="radio-group">
              <label
                v-for="opt in inkSimulationOptions"
                :key="opt.value"
                class="radio-item"
                :class="{ 'is-checked': inkSimulation === opt.value }"
              >
                <input
                  type="radio"
                  :value="opt.value"
                  v-model="inkSimulation"
                  class="radio-input"
                />
                <span class="radio-mark"></span>
                <span class="radio-label">
                  <span class="label-text">{{ opt.label }}</span>
                  <span class="label-desc">{{ opt.description }}</span>
                </span>
              </label>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">
              <Sun :size="16" class="section-icon" />
              <span>光照环境</span>
            </div>
            <div class="radio-group">
              <label
                v-for="opt in lightingOptions"
                :key="opt.value"
                class="radio-item"
                :class="{ 'is-checked': lighting === opt.value }"
              >
                <input
                  type="radio"
                  :value="opt.value"
                  v-model="lighting"
                  class="radio-input"
                />
                <span class="radio-mark"></span>
                <span class="radio-label">
                  <span class="label-text">{{ opt.label }}</span>
                  <span class="label-desc">{{ opt.description }}</span>
                </span>
              </label>
            </div>
          </div>

          <div class="settings-section">
            <div class="section-title">
              <Scissors :size="16" class="section-icon" />
              <span>标记设置</span>
            </div>
            <div class="toggle-group">
              <label class="toggle-item">
                <div class="toggle-info">
                  <Crop :size="14" class="toggle-icon" />
                  <span class="toggle-label">显示出血线</span>
                </div>
                <div class="toggle-switch" :class="{ 'is-on': showBleed }">
                  <input
                    type="checkbox"
                    v-model="showBleed"
                    class="toggle-input"
                  />
                  <span class="toggle-track"></span>
                  <span class="toggle-thumb"></span>
                </div>
              </label>
              <label class="toggle-item">
                <div class="toggle-info">
                  <Scissors :size="14" class="toggle-icon" />
                  <span class="toggle-label">显示裁切线</span>
                </div>
                <div class="toggle-switch" :class="{ 'is-on': showCropMarks }">
                  <input
                    type="checkbox"
                    v-model="showCropMarks"
                    class="toggle-input"
                  />
                  <span class="toggle-track"></span>
                  <span class="toggle-thumb"></span>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div class="preview-container" ref="containerRef">
          <div class="canvas-wrapper">
            <canvas ref="canvasRef" class="preview-canvas"></canvas>
          </div>
          <div v-if="exporting" class="export-overlay">
            <div class="export-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
              </div>
              <span class="progress-text">正在导出... {{ progress }}%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <div class="export-buttons">
          <button
            class="btn-film btn-film-secondary"
            @click="handleExportPdf"
            :disabled="exporting"
          >
            <Download :size="16" />
            <span>导出 PDF</span>
          </button>
          <div class="image-export-group">
            <button
              class="btn-film btn-film-secondary"
              @click="handleExportImage('png')"
              :disabled="exporting"
            >
              <Download :size="16" />
              <span>PNG</span>
            </button>
            <button
              class="btn-film btn-film-secondary"
              @click="handleExportImage('jpg')"
              :disabled="exporting"
            >
              <Download :size="16" />
              <span>JPG</span>
            </button>
          </div>
          <button
            class="btn-film btn-film-primary"
            @click="handleBrowserPrint"
            :disabled="exporting"
          >
            <Printer :size="16" />
            <span>打印</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(26, 22, 20, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.preview-modal {
  width: 100%;
  max-width: 1400px;
  height: calc(100vh - 48px);
  max-height: 900px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.title-icon {
  color: var(--accent);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.settings-panel {
  width: 320px;
  padding: 20px;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.section-icon {
  color: var(--accent);
}

.texture-dropdown {
  position: relative;
}

.dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-trigger:hover {
  border-color: var(--accent);
}

.dropdown-arrow {
  color: var(--text-secondary);
  transition: transform 0.2s ease;
}

.texture-dropdown.is-open .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px var(--shadow);
  z-index: 10;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background: var(--bg-secondary);
}

.dropdown-item.is-selected {
  background: rgba(212, 168, 83, 0.1);
}

.item-label {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
}

.item-desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.slider-value {
  color: var(--accent);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.radio-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-item:hover {
  background: var(--bg-secondary);
}

.radio-item.is-checked {
  background: rgba(212, 168, 83, 0.1);
}

.radio-input {
  display: none;
}

.radio-mark {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid var(--border-color);
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.radio-item.is-checked .radio-mark {
  border-color: var(--accent);
}

.radio-mark::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 10px;
  height: 10px;
  background: var(--accent);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.2s ease;
}

.radio-item.is-checked .radio-mark::after {
  transform: translate(-50%, -50%) scale(1);
}

.radio-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.label-text {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
}

.label-desc {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.toggle-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.toggle-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-icon {
  color: var(--accent);
}

.toggle-label {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-input {
  display: none;
}

.toggle-track {
  position: absolute;
  inset: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.toggle-switch.is-on .toggle-track {
  background: var(--accent);
  border-color: var(--accent);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: var(--bg-card);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.toggle-switch.is-on .toggle-thumb {
  left: 23px;
}

.preview-container {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  padding: 24px;
  overflow: hidden;
}

.canvas-wrapper {
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.preview-canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.export-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 22, 20, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.export-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 32px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background: var(--bg-card);
}

.export-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.image-export-group {
  display: flex;
  gap: 8px;
}

.btn-film:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
