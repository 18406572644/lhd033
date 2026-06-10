<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2, Upload, Film, BookOpen, Palette } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'
import { useGalleryStore } from '@/stores/gallery'

const router = useRouter()
const editorStore = useEditorStore()
const galleryStore = useGalleryStore()
const activeTab = ref<'cases' | 'schemes'>('cases')

onMounted(() => {
  galleryStore.init()
})

function loadCaseToEditor(params: any) {
  editorStore.setParams(params)
  router.push('/')
}

function loadSchemeToEditor(scheme: any) {
  editorStore.setParams(scheme.params)
  if (scheme.presetId) {
    editorStore.applyPreset(scheme.presetId, scheme.params)
  } else {
    editorStore.resetParams()
    editorStore.setParams(scheme.params)
  }
  router.push('/')
}

async function deleteScheme(id: string, e: Event) {
  e.stopPropagation()
  await galleryStore.removeScheme(id)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="gallery-page">
    <div class="gallery-hero">
      <div class="hero-content">
        <Film :size="32" class="hero-icon" />
        <h1 class="hero-title">案例库</h1>
        <p class="hero-subtitle">探索经典胶片风格，管理你的调色方案</p>
      </div>
    </div>

    <div class="gallery-tabs">
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'cases' }"
        @click="activeTab = 'cases'"
      >
        <BookOpen :size="16" />
        经典胶片案例
      </button>
      <button
        class="tab-btn"
        :class="{ 'tab-btn--active': activeTab === 'schemes' }"
        @click="activeTab = 'schemes'"
      >
        <Palette :size="16" />
        我的方案
        <span v-if="galleryStore.savedSchemes.length" class="tab-count">
          {{ galleryStore.savedSchemes.length }}
        </span>
      </button>
    </div>

    <Transition name="tab-fade" mode="out-in">
      <div v-if="activeTab === 'cases'" key="cases" class="cases-grid">
        <div
          v-for="caseItem in galleryStore.filmCases"
          :key="caseItem.id"
          class="case-card card-film"
        >
          <div class="case-image vignette">
            <img :src="caseItem.image" :alt="caseItem.filmName" loading="lazy" />
          </div>
          <div class="case-body">
            <div class="case-meta">
              <span class="case-film">{{ caseItem.filmName }}</span>
              <span class="case-style">{{ caseItem.style }}</span>
            </div>
            <p class="case-desc">{{ caseItem.description }}</p>
            <button
              class="btn-film btn-film-primary case-load-btn"
              @click="loadCaseToEditor(caseItem.params)"
            >
              <Upload :size="13" />
              加载到编辑器
            </button>
          </div>
        </div>
      </div>

      <div v-else key="schemes" class="schemes-section">
        <div v-if="galleryStore.savedSchemes.length === 0" class="schemes-empty">
          <Palette :size="40" class="empty-icon" />
          <p class="empty-text">还没有保存的方案</p>
          <p class="empty-sub">在编辑器中调色后保存你的方案</p>
          <button class="btn-film btn-film-primary" @click="router.push('/')">
            前往编辑器
          </button>
        </div>

        <div v-else class="schemes-list">
          <div
            v-for="scheme in galleryStore.savedSchemes"
            :key="scheme.id"
            class="scheme-card card-film"
            @click="loadSchemeToEditor(scheme)"
          >
            <div class="scheme-thumb">
              <img v-if="scheme.thumbnail" :src="scheme.thumbnail" :alt="scheme.name" />
              <span v-else class="scheme-thumb-placeholder">🎨</span>
            </div>
            <div class="scheme-body">
              <span class="scheme-name">{{ scheme.name }}</span>
              <span class="scheme-date">{{ formatDate(scheme.createdAt) }}</span>
              <div class="scheme-params">
                <span>亮度 {{ scheme.params.brightness }}</span>
                <span>对比 {{ scheme.params.contrast }}</span>
                <span>色温 {{ scheme.params.temperature }}</span>
                <span>颗粒 {{ scheme.params.grain }}</span>
              </div>
            </div>
            <button
              class="scheme-delete"
              title="删除方案"
              @click="deleteScheme(scheme.id, $event)"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.gallery-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px 24px 60px;
}

.gallery-hero {
  text-align: center;
  padding: 32px 20px;
  margin-bottom: 8px;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.hero-icon {
  color: var(--accent);
  opacity: 0.8;
}

.hero-title {
  font-family: 'Playfair Display', serif;
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: 0.02em;
}

.hero-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.gallery-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 24px;
  padding: 4px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn--active {
  background: var(--bg-card);
  color: var(--accent);
  box-shadow: 0 2px 8px var(--shadow);
}

.tab-count {
  font-size: 0.65rem;
  font-weight: 700;
  background: var(--accent);
  color: #1A1614;
  padding: 1px 6px;
  border-radius: 9999px;
  min-width: 18px;
  text-align: center;
}

.cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.case-card {
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.case-card:hover {
  transform: translateY(-4px);
}

.case-image {
  position: relative;
  overflow: hidden;
  aspect-ratio: 4 / 3;
}

.case-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.case-card:hover .case-image img {
  transform: scale(1.05);
}

.case-body {
  padding: 16px;
}

.case-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.case-film {
  font-family: 'Playfair Display', serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
}

.case-style {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 9999px;
  background: rgba(212, 168, 83, 0.15);
  color: var(--accent);
}

.case-desc {
  font-size: 0.82rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0 0 14px;
}

.case-load-btn {
  font-size: 0.78rem;
  padding: 6px 14px;
}

.schemes-section {
  max-width: 700px;
  margin: 0 auto;
}

.schemes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--text-secondary);
  opacity: 0.3;
}

.empty-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.empty-sub {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
  margin: 0 0 8px;
}

.schemes-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scheme-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  cursor: pointer;
}

.scheme-thumb {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
}

.scheme-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scheme-thumb-placeholder {
  font-size: 1.4rem;
}

.scheme-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scheme-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.scheme-date {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.scheme-params {
  display: flex;
  gap: 10px;
  font-size: 0.65rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.scheme-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.scheme-delete:hover {
  border-color: #C0392B;
  color: #C0392B;
  background: rgba(192, 57, 43, 0.1);
}

.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 768px) {
  .cases-grid {
    grid-template-columns: 1fr;
  }
}
</style>
