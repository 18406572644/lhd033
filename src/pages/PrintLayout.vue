<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { savePrintProject } from '@/api/printProjects'
import PaperSettings from '@/components/print/PaperSettings.vue'
import SmartLayoutToolbar from '@/components/print/SmartLayoutToolbar.vue'
import TemplatePanel from '@/components/print/TemplatePanel.vue'
import LayoutCanvas from '@/components/print/LayoutCanvas.vue'
import ImageProperty from '@/components/print/ImageProperty.vue'
import PrintPreview from '@/components/print/PrintPreview.vue'
import ExportBar from '@/components/print/ExportBar.vue'
import {
  Save,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Eye,
  PanelLeftClose,
  PanelRightClose,
  PanelLeft,
  PanelRight,
  ImagePlus,
  Settings,
  LayoutGrid,
  FileText,
  Check,
  Loader2,
  ChevronDown,
} from 'lucide-vue-next'

const store = usePrintLayoutStore()
const { projectName, zoom, showPreviewModal, selectedImageIds, images } = storeToRefs(store)

const layoutCanvasRef = ref<InstanceType<typeof LayoutCanvas> | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)
const leftActiveTab = ref<'settings' | 'templates'>('settings')
const isSaving = ref(false)
const saveSuccess = ref(false)
const isEditingName = ref(false)
const editedProjectName = ref('')

const zoomPercent = computed(() => Math.round(zoom.value * 100))

const zoomSliderBackground = computed(() => {
  const pct = ((zoom.value - 0.1) / (5 - 0.1)) * 100
  return `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, var(--bg-secondary) ${pct}%, var(--bg-secondary) 100%)`
})

function toggleLeftSidebar() {
  leftSidebarCollapsed.value = !leftSidebarCollapsed.value
}

function toggleRightSidebar() {
  rightSidebarCollapsed.value = !rightSidebarCollapsed.value
}

function setZoomPercent(percent: number) {
  store.setZoom(percent / 100)
}

function zoomIn() {
  store.setZoom(Math.min(5, zoom.value + 0.1))
}

function zoomOut() {
  store.setZoom(Math.max(0.1, zoom.value - 0.1))
}

function resetView() {
  store.resetZoom()
  layoutCanvasRef.value?.fitToWindow()
}

function fitToWindow() {
  layoutCanvasRef.value?.fitToWindow()
}

function openPrintPreview() {
  store.togglePreviewModal()
}

function closePrintPreview() {
  store.togglePreviewModal()
}

function openImageUpload() {
  fileInputRef.value?.click()
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files) return

  Array.from(files).forEach((file) => {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const img = new Image()
      img.onload = () => {
        store.addImage(dataUrl, file.name, img.width, img.height)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  })

  target.value = ''
}

function startEditingName() {
  editedProjectName.value = projectName.value
  isEditingName.value = true
}

function finishEditingName() {
  store.projectName = editedProjectName.value.trim() || '未命名项目'
  isEditingName.value = false
}

async function handleSave() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const projectData = store.getProjectData()
    const saved = await savePrintProject(projectData)
    store.projectId = saved.id
    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 2000)
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    isSaving.value = false
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    if (e.key === 'Enter' && isEditingName.value) {
      finishEditingName()
    }
    return
  }

  if (e.ctrlKey || e.metaKey) {
    switch (e.key.toLowerCase()) {
      case 's':
        e.preventDefault()
        handleSave()
        break
      case 'p':
        e.preventDefault()
        openPrintPreview()
        break
      case 'z':
        e.preventDefault()
        break
    }
  } else {
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        if (selectedImageIds.value.length > 0) {
          e.preventDefault()
          ;[...selectedImageIds.value].forEach((id) => store.removeImage(id))
        }
        break
      case 'Escape':
        if (isEditingName.value) {
          isEditingName.value = false
        }
        break
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="print-layout">
    <header class="top-toolbar">
      <div class="toolbar-left">
        <div class="project-name">
          <FileText :size="18" class="name-icon" />
          <input
            v-if="isEditingName"
            v-model="editedProjectName"
            type="text"
            class="name-input"
            @blur="finishEditingName"
            @keyup.enter="finishEditingName"
            @keyup.escape="isEditingName = false"
            autofocus
          />
          <span v-else class="name-text" @click="startEditingName">
            {{ projectName }}
          </span>
          <ChevronDown :size="14" class="edit-icon" />
        </div>
      </div>

      <div class="toolbar-center">
        <button class="toolbar-btn" @click="openImageUpload" title="添加图片">
          <ImagePlus :size="18" />
          <span>添加图片</span>
        </button>
        <button
          class="toolbar-btn primary"
          :class="{ success: saveSuccess }"
          :disabled="isSaving"
          @click="handleSave"
          title="保存项目 (Ctrl+S)"
        >
          <Loader2 v-if="isSaving" :size="16" class="spin" />
          <Check v-else-if="saveSuccess" :size="16" />
          <Save v-else :size="16" />
          <span>{{ saveSuccess ? '已保存' : '保存' }}</span>
        </button>

        <div class="divider" />

        <div class="zoom-controls">
          <button class="icon-btn" @click="zoomOut" title="缩小">
            <ZoomOut :size="16" />
          </button>
          <div class="zoom-slider-wrapper">
            <input
              type="range"
              min="10"
              max="500"
              :value="zoomPercent"
              class="zoom-slider"
              :style="{ background: zoomSliderBackground }"
              @input="(e) => setZoomPercent(Number((e.target as HTMLInputElement).value))"
            />
          </div>
          <span class="zoom-value">{{ zoomPercent }}%</span>
          <button class="icon-btn" @click="zoomIn" title="放大">
            <ZoomIn :size="16" />
          </button>
          <div class="zoom-presets">
            <button class="preset-btn" @click="setZoomPercent(50)">50%</button>
            <button class="preset-btn" @click="setZoomPercent(100)">100%</button>
            <button class="preset-btn" @click="setZoomPercent(200)">200%</button>
          </div>
          <button class="icon-btn" @click="fitToWindow" title="适应窗口">
            <Maximize2 :size="16" />
          </button>
          <button class="icon-btn" @click="resetView" title="重置视图">
            <RotateCcw :size="16" />
          </button>
        </div>

        <div class="divider" />

        <button class="toolbar-btn" @click="openPrintPreview" title="打印预览 (Ctrl+P)">
          <Eye :size="16" />
          <span>打印预览</span>
        </button>
      </div>

      <div class="toolbar-right">
        <button
          class="icon-btn"
          @click="toggleLeftSidebar"
          :title="leftSidebarCollapsed ? '展开左侧边栏' : '折叠左侧边栏'"
        >
          <PanelLeftClose v-if="!leftSidebarCollapsed" :size="18" />
          <PanelLeft v-else :size="18" />
        </button>
        <button
          class="icon-btn"
          @click="toggleRightSidebar"
          :title="rightSidebarCollapsed ? '展开右侧边栏' : '折叠右侧边栏'"
        >
          <PanelRightClose v-if="!rightSidebarCollapsed" :size="18" />
          <PanelRight v-else :size="18" />
        </button>
      </div>
    </header>

    <div class="main-content">
      <aside
        class="sidebar left-sidebar"
        :class="{ collapsed: leftSidebarCollapsed }"
        :style="{ width: leftSidebarCollapsed ? '0px' : '280px' }"
      >
        <div v-show="!leftSidebarCollapsed" class="sidebar-content">
          <div class="sidebar-tabs">
            <button
              class="tab-btn"
              :class="{ active: leftActiveTab === 'settings' }"
              @click="leftActiveTab = 'settings'"
            >
              <Settings :size="16" />
              <span>设置</span>
            </button>
            <button
              class="tab-btn"
              :class="{ active: leftActiveTab === 'templates' }"
              @click="leftActiveTab = 'templates'"
            >
              <LayoutGrid :size="16" />
              <span>模板</span>
            </button>
          </div>

          <div class="tab-content">
            <div v-show="leftActiveTab === 'settings'" class="settings-content">
              <SmartLayoutToolbar />
              <div class="component-spacer" />
              <PaperSettings />
            </div>
            <div v-show="leftActiveTab === 'templates'" class="templates-content">
              <TemplatePanel />
            </div>
          </div>
        </div>
      </aside>

      <main class="canvas-area">
        <LayoutCanvas ref="layoutCanvasRef" />
      </main>

      <aside
        class="sidebar right-sidebar"
        :class="{ collapsed: rightSidebarCollapsed }"
        :style="{ width: rightSidebarCollapsed ? '0px' : '300px' }"
      >
        <div v-show="!rightSidebarCollapsed" class="sidebar-content">
          <ImageProperty />
        </div>
      </aside>
    </div>

    <ExportBar @print-preview="openPrintPreview" />

    <input
      ref="fileInputRef"
      type="file"
      multiple
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      class="hidden-input"
      @change="handleFileChange"
    />

    <Teleport to="body">
      <Transition name="modal">
        <PrintPreview v-if="showPreviewModal" @close="closePrintPreview" />
      </Transition>
    </Teleport>

    <div class="keyboard-hints">
      <span class="hint"><kbd>Ctrl</kbd> + <kbd>S</kbd> 保存</span>
      <span class="hint"><kbd>Ctrl</kbd> + <kbd>P</kbd> 打印</span>
      <span class="hint"><kbd>Delete</kbd> 删除</span>
    </div>
  </div>
</template>

<style scoped>
.print-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  min-height: 0;
  overflow: hidden;
  background: var(--bg-primary);
}

.top-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 12px var(--shadow);
  z-index: 100;
  gap: 20px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  min-width: 200px;
}

.project-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 9999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-name:hover {
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(212, 168, 83, 0.2);
}

.name-icon {
  color: var(--accent);
}

.name-text {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name-input {
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.95rem;
  background: transparent;
  border: none;
  outline: none;
  padding: 0;
  min-width: 120px;
}

.edit-icon {
  color: var(--text-secondary);
  opacity: 0.5;
}

.toolbar-center {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 80px;
  justify-content: flex-end;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 9999px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.toolbar-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--accent);
  box-shadow: 0 0 12px rgba(212, 168, 83, 0.2);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a1614;
}

.toolbar-btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 0 20px rgba(212, 168, 83, 0.4);
}

.toolbar-btn.success {
  background: #27ae60;
  border-color: #27ae60;
  color: white;
}

.divider {
  width: 1px;
  height: 28px;
  background: var(--border-color);
  margin: 0 4px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--bg-secondary);
  border-radius: 9999px;
}

.icon-btn {
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

.icon-btn:hover {
  background: var(--bg-card);
  color: var(--accent);
}

.zoom-slider-wrapper {
  width: 120px;
}

.zoom-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.zoom-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.zoom-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0 12px rgba(212, 168, 83, 0.6);
}

.zoom-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.zoom-value {
  min-width: 48px;
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.zoom-presets {
  display: flex;
  gap: 2px;
  padding-left: 8px;
  border-left: 1px solid var(--border-color);
  margin-left: 4px;
}

.preset-btn {
  padding: 4px 8px;
  font-size: 0.7rem;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.preset-btn:hover {
  background: var(--bg-card);
  color: var(--accent);
  border-color: var(--accent);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: var(--bg-card);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s ease;
  overflow: hidden;
}

.right-sidebar {
  border-right: none;
  border-left: 1px solid var(--border-color);
}

.sidebar.collapsed {
  border-color: transparent;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sidebar-tabs {
  display: flex;
  padding: 12px;
  gap: 8px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: inherit;
}

.tab-btn:hover {
  color: var(--text-primary);
  border-color: var(--accent);
}

.tab-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a1614;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.component-spacer {
  height: 4px;
}

.templates-content {
  height: 100%;
}

.canvas-area {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.hidden-input {
  display: none;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.keyboard-hints {
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 50;
  pointer-events: none;
}

.hint {
  font-size: 0.7rem;
  color: var(--text-secondary);
  opacity: 0.6;
  display: flex;
  align-items: center;
  gap: 4px;
}

kbd {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.65rem;
  font-family: 'Courier New', monospace;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 1200px) {
  .zoom-presets {
    display: none;
  }

  .zoom-slider-wrapper {
    width: 80px;
  }

  .toolbar-btn span {
    display: none;
  }
}

@media (max-width: 900px) {
  .top-toolbar {
    flex-wrap: wrap;
    padding: 10px;
  }

  .toolbar-center {
    order: 3;
    width: 100%;
    justify-content: space-between;
    overflow-x: auto;
  }

  .zoom-controls {
    flex: 1;
    min-width: 200px;
  }

  .sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 50;
    box-shadow: 4px 0 20px var(--shadow);
  }

  .right-sidebar {
    right: 0;
    box-shadow: -4px 0 20px var(--shadow);
  }

  .keyboard-hints {
    display: none;
  }
}
</style>
