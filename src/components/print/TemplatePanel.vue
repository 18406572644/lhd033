<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { LayoutGrid, Save, Trash2 } from 'lucide-vue-next'
import {
  fetchTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  generateTemplateThumbnail,
} from '@/api/templates'
import { usePrintLayoutStore } from '@/stores/printLayout'
import type { LayoutTemplate } from '@/types'

const printLayoutStore = usePrintLayoutStore()

type TemplateCategory = 'id' | 'polaroid' | 'photowall' | 'comparison' | 'custom'

const categoryNames: Record<TemplateCategory, string> = {
  id: '证件照',
  polaroid: '拍立得',
  photowall: '照片墙',
  comparison: '对比排版',
  custom: '我的模板',
}

const categories: TemplateCategory[] = ['id', 'polaroid', 'photowall', 'comparison', 'custom']

const activeCategory = ref<TemplateCategory>('id')
const templates = ref<LayoutTemplate[]>([])
const loading = ref(false)
const showSaveDialog = ref(false)
const templateName = ref('')
const templateDescription = ref('')
const deletingId = ref<string | null>(null)

const filteredTemplates = computed(() => {
  return templates.value.filter((t) => t.category === activeCategory.value)
})

async function loadTemplates() {
  loading.value = true
  try {
    templates.value = await fetchTemplates()
  } finally {
    loading.value = false
  }
}

function handleTemplateClick(template: LayoutTemplate) {
  printLayoutStore.applyTemplate(template)
}

function openSaveDialog() {
  templateName.value = ''
  templateDescription.value = ''
  showSaveDialog.value = true
}

function closeSaveDialog() {
  showSaveDialog.value = false
  templateName.value = ''
  templateDescription.value = ''
}

async function handleSaveTemplate() {
  const name = templateName.value.trim()
  if (!name) return

  const currentTemplate: Omit<LayoutTemplate, 'id' | 'isCustom' | 'createdAt'> = {
    name,
    category: 'custom',
    description: templateDescription.value.trim(),
    thumbnail: '',
    paper: { ...printLayoutStore.paper },
    imageSlots: printLayoutStore.images.map((img) => ({
      x: img.x,
      y: img.y,
      width: img.width,
      height: img.height,
      rotation: img.rotation,
      border: img.border,
    })),
  }

  try {
    const saved = await saveCustomTemplate(currentTemplate)
    saved.thumbnail = await generateTemplateThumbnail(saved)
    await loadTemplates()
    activeCategory.value = 'custom'
    closeSaveDialog()
  } catch (error) {
    console.error('保存模板失败:', error)
  }
}

function confirmDelete(id: string) {
  deletingId.value = id
}

function cancelDelete() {
  deletingId.value = null
}

async function handleDeleteTemplate(id: string) {
  try {
    await deleteCustomTemplate(id)
    deletingId.value = null
    await loadTemplates()
  } catch (error) {
    console.error('删除模板失败:', error)
  }
}

onMounted(() => {
  loadTemplates()
})
</script>

<template>
  <div class="template-panel">
    <div class="panel-header">
      <div class="header-title-row">
        <LayoutGrid :size="18" class="header-icon" />
        <span class="header-title">模板库</span>
      </div>
      <button class="save-btn" @click="openSaveDialog">
        <Save :size="14" />
        保存为模板
      </button>
    </div>

    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat"
        class="category-tab"
        :class="{ 'category-tab--active': activeCategory === cat }"
        @click="activeCategory = cat"
      >
        {{ categoryNames[cat] }}
      </button>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <span class="loading-text">加载中...</span>
    </div>

    <div v-else-if="filteredTemplates.length === 0" class="empty-state">
      <LayoutGrid :size="32" class="empty-icon" />
      <span class="empty-text">暂无{{ categoryNames[activeCategory] }}模板</span>
    </div>

    <div v-else class="template-grid">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="template-card"
        @click="handleTemplateClick(template)"
      >
        <div v-if="deletingId === template.id" class="delete-overlay" @click.stop>
          <span class="delete-confirm-text">确定删除？</span>
          <div class="delete-actions">
            <button class="delete-cancel-btn" @click="cancelDelete">取消</button>
            <button class="delete-confirm-btn" @click="handleDeleteTemplate(template.id)">
              <Trash2 :size="12" />
              删除
            </button>
          </div>
        </div>
        <div class="template-thumbnail">
          <img v-if="template.thumbnail" :src="template.thumbnail" :alt="template.name" />
          <div v-else class="thumbnail-placeholder">
            <LayoutGrid :size="24" />
          </div>
        </div>
        <div class="template-info">
          <span class="template-name">{{ template.name }}</span>
          <span class="template-desc">{{ template.description }}</span>
        </div>
        <button
          v-if="template.isCustom"
          class="delete-btn"
          @click.stop="confirmDelete(template.id)"
          title="删除模板"
        >
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showSaveDialog" class="modal-overlay" @click.self="closeSaveDialog">
          <div class="modal-card">
            <div class="modal-header">
              <div class="modal-title-row">
                <Save :size="18" class="modal-icon" />
                <span class="modal-title">保存为模板</span>
              </div>
              <button class="modal-close" @click="closeSaveDialog">
                <span>×</span>
              </button>
            </div>
            <div class="modal-body">
              <label class="modal-label">模板名称</label>
              <input
                v-model="templateName"
                type="text"
                class="modal-input"
                placeholder="为你的模板命名..."
                maxlength="30"
                @keyup.enter="handleSaveTemplate"
              />
              <label class="modal-label">模板描述</label>
              <textarea
                v-model="templateDescription"
                class="modal-textarea"
                placeholder="描述这个模板的用途..."
                maxlength="100"
                rows="2"
              />
            </div>
            <div class="modal-footer">
              <button class="btn-film btn-film-secondary" @click="closeSaveDialog">取消</button>
              <button
                class="btn-film btn-film-primary"
                :disabled="!templateName.trim()"
                @click="handleSaveTemplate"
              >
                <Save :size="14" />
                保存
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.template-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--accent);
}

.header-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--accent);
  color: #1a1614;
  border: 1px solid var(--accent);
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 12px rgba(212, 168, 83, 0.3);
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.category-tab {
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.category-tab:hover {
  color: var(--text-primary);
  background: var(--bg-card);
}

.category-tab--active {
  background: var(--accent);
  color: #1a1614;
  border-color: var(--accent);
}

.category-tab--active:hover {
  background: var(--accent-hover);
  color: #1a1614;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  gap: 12px;
  flex: 1;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-color);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.empty-text {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.empty-icon {
  color: var(--text-secondary);
  opacity: 0.4;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}

.template-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px var(--shadow);
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--shadow);
  border-color: var(--accent);
}

.template-thumbnail {
  aspect-ratio: 4 / 3;
  background: var(--bg-secondary);
  overflow: hidden;
  position: relative;
}

.template-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #ffffff;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  opacity: 0.5;
}

.template-info {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.template-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.template-desc {
  font-size: 0.68rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.8;
}

.delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-color);
  color: #c0392b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.template-card:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: #c0392b;
  color: white;
  border-color: #c0392b;
}

.delete-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26, 22, 20, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 10;
}

.delete-confirm-text {
  font-size: 0.85rem;
  color: #faf0e6;
  font-weight: 500;
}

.delete-actions {
  display: flex;
  gap: 8px;
}

.delete-cancel-btn,
.delete-confirm-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}

.delete-cancel-btn {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-color);
}

.delete-cancel-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.delete-confirm-btn {
  background: #c0392b;
  color: white;
  border-color: #c0392b;
}

.delete-confirm-btn:hover {
  background: #a93226;
  box-shadow: 0 0 12px rgba(192, 57, 43, 0.4);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-icon {
  color: var(--accent);
}

.modal-title {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.2rem;
  line-height: 1;
}

.modal-close:hover {
  background: var(--border-color);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px;
}

.modal-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.modal-label:not(:first-child) {
  margin-top: 14px;
}

.modal-input,
.modal-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9rem;
  font-family: 'Noto Sans SC', sans-serif;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  box-sizing: border-box;
}

.modal-textarea {
  resize: vertical;
  min-height: 60px;
}

.modal-input:focus,
.modal-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.15);
}

.modal-input::placeholder,
.modal-textarea::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-card {
  transform: scale(0.95) translateY(10px);
}

.modal-fade-leave-to .modal-card {
  transform: scale(0.95) translateY(10px);
}
</style>
