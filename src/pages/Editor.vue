<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { RotateCcw, Save, Download, ImagePlus, Undo2, Redo2 } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'
import { useGalleryStore } from '@/stores/gallery'
import { useExport } from '@/composables/useExport'
import { fetchPresets } from '@/api/presets'
import ImageUploader from '@/components/ImageUploader.vue'
import PreviewCanvas from '@/components/PreviewCanvas.vue'
import PresetSlider from '@/components/PresetSlider.vue'
import ParamControl from '@/components/ParamControl.vue'
import AdvancedParamPanel from '@/components/AdvancedParamPanel.vue'
import HistoryPanel from '@/components/HistoryPanel.vue'
import SaveSchemeDialog from '@/components/SaveSchemeDialog.vue'
import type { FilmPreset } from '@/types'

const router = useRouter()
const editorStore = useEditorStore()
const galleryStore = useGalleryStore()
const { exporting, exportImage } = useExport()

const showSaveDialog = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const presets = ref<FilmPreset[]>([])

onMounted(async () => {
  presets.value = await fetchPresets()
  galleryStore.loadSchemes()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if (!editorStore.hasImage) return

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const ctrlKey = isMac ? e.metaKey : e.ctrlKey

  if (ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    editorStore.undo()
  }

  if (ctrlKey && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
    e.preventDefault()
    editorStore.redo()
  }
}

const activePresetName = computed(() => {
  if (!editorStore.activePresetId) return null
  return presets.value.find(p => p.id === editorStore.activePresetId)?.name ?? null
})

function onReset() {
  editorStore.resetParams()
}

async function onSave(name: string) {
  showSaveDialog.value = false

  const canvas = document.querySelector('.compare-filtered') as HTMLCanvasElement
  let thumbnail = ''
  if (canvas) {
    try {
      thumbnail = canvas.toDataURL('image/jpeg', 0.3)
    } catch { thumbnail = '' }
  }

  await galleryStore.addScheme({
    name,
    thumbnail,
    params: { ...editorStore.params },
    presetId: editorStore.activePresetId ?? undefined,
  })
}

async function onExport() {
  const canvas = document.querySelector('.compare-filtered') as HTMLCanvasElement
  if (!canvas) return
  await exportImage(canvas, editorStore.imageName || 'photo')
}

function changeImage() {
  editorStore.resetAll()
}

function loadScheme(scheme: { params: any; presetId?: string }) {
  editorStore.loadScheme(scheme.params, scheme.presetId)
}
</script>

<template>
  <div class="editor-page">
    <div class="editor-layout">
      <div class="editor-main">
        <ImageUploader v-if="!editorStore.hasImage" @uploaded="() => {}" />

        <div v-else class="editor-preview-area">
          <PreviewCanvas />
          <div class="editor-toolbar">
            <button class="btn-film btn-film-secondary" @click="changeImage">
              <ImagePlus :size="14" />
              更换图片
            </button>
            <div v-if="activePresetName" class="active-preset-badge">
              {{ activePresetName }}
            </div>
          </div>
        </div>
      </div>

      <div class="editor-sidebar">
        <PresetSlider />

        <ParamControl />

        <AdvancedParamPanel />

        <HistoryPanel />

        <div class="editor-actions">
          <button
            class="btn-film btn-film-secondary action-btn"
            :disabled="!editorStore.isModified"
            @click="onReset"
          >
            <RotateCcw :size="14" />
            重置参数
          </button>
          <button
            class="btn-film btn-film-primary action-btn"
            :disabled="!editorStore.hasImage"
            @click="showSaveDialog = true"
          >
            <Save :size="14" />
            保存方案
          </button>
          <button
            class="btn-film btn-film-primary action-btn"
            :disabled="!editorStore.hasImage || exporting"
            @click="onExport"
          >
            <Download :size="14" />
            {{ exporting ? '导出中...' : '导出效果图' }}
          </button>
        </div>

        <div v-if="galleryStore.savedSchemes.length > 0" class="recent-schemes">
          <div class="recent-header">
            <span class="recent-title">最近保存</span>
            <button class="recent-more" @click="router.push('/gallery')">
              查看全部 →
            </button>
          </div>
          <div class="recent-list">
            <div
              v-for="scheme in galleryStore.savedSchemes.slice(0, 3)"
              :key="scheme.id"
              class="recent-item card-film"
              @click="loadScheme(scheme)"
            >
              <div class="recent-thumb">
                <img v-if="scheme.thumbnail" :src="scheme.thumbnail" :alt="scheme.name" />
                <span v-else class="recent-thumb-placeholder">🎨</span>
              </div>
              <div class="recent-info">
                <span class="recent-name">{{ scheme.name }}</span>
                <span class="recent-date">{{ new Date(scheme.createdAt).toLocaleDateString('zh-CN') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SaveSchemeDialog
      :visible="showSaveDialog"
      @save="onSave"
      @close="showSaveDialog = false"
    />
  </div>
</template>

<style scoped>
.editor-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 24px 40px;
}

.editor-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
}

.editor-main {
  min-width: 0;
}

.editor-preview-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.active-preset-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 9999px;
  background: rgba(212, 168, 83, 0.15);
  color: var(--accent);
  border: 1px solid rgba(212, 168, 83, 0.3);
}

.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 84px;
}

.editor-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  min-width: 90px;
  justify-content: center;
}

.action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.recent-schemes {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 12px;
}

.recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.recent-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
}

.recent-more {
  font-size: 0.7rem;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.recent-more:hover {
  opacity: 0.7;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.recent-item:hover {
  background: var(--bg-secondary);
}

.recent-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.recent-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recent-thumb-placeholder {
  font-size: 1.2rem;
}

.recent-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.recent-name {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-date {
  font-size: 0.65rem;
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .editor-sidebar {
    position: static;
  }
}
</style>
