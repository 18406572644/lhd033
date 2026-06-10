<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { Undo2, Redo2, History, Clock } from 'lucide-vue-next'

const editorStore = useEditorStore()

const historyItems = computed(() => {
  return [...editorStore.historyList].reverse()
})

const reversedIndex = computed(() => {
  if (editorStore.historyList.length === 0) return -1
  return editorStore.historyList.length - 1 - editorStore.currentHistoryIndex
})

function handleUndo() {
  editorStore.undo()
}

function handleRedo() {
  editorStore.redo()
}

function handleJump(index: number) {
  const actualIndex = editorStore.historyList.length - 1 - index
  editorStore.goToHistory(actualIndex)
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}
</script>

<template>
  <div class="history-panel">
    <div class="history-header">
      <div class="history-title-row">
        <History :size="16" class="history-icon" />
        <span class="history-title">操作记录</span>
        <span class="history-count">{{ editorStore.historyList.length }}/20</span>
      </div>
      <div class="history-actions">
        <button
          class="history-action-btn"
          :class="{ 'history-action-btn--disabled': !editorStore.canUndo }"
          :disabled="!editorStore.canUndo"
          @click="handleUndo"
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 :size="14" />
        </button>
        <button
          class="history-action-btn"
          :class="{ 'history-action-btn--disabled': !editorStore.canRedo }"
          :disabled="!editorStore.canRedo"
          @click="handleRedo"
          title="重做 (Ctrl+Y)"
        >
          <Redo2 :size="14" />
        </button>
      </div>
    </div>

    <div v-if="historyItems.length === 0" class="history-empty">
      <Clock :size="24" class="empty-icon" />
      <span class="empty-text">暂无操作记录</span>
    </div>

    <div v-else class="history-list">
      <div
        v-for="(item, index) in historyItems"
        :key="item.id"
        class="history-item"
        :class="{ 'history-item--active': index === reversedIndex }"
        @click="handleJump(index)"
      >
        <div class="history-item-dot"></div>
        <div class="history-item-content">
          <span class="history-item-name">{{ item.name }}</span>
          <span class="history-item-time">{{ formatTime(item.timestamp) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-panel {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
}

.history-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.history-icon {
  color: var(--accent);
}

.history-title {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.history-count {
  font-size: 0.65rem;
  color: var(--text-secondary);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 9999px;
}

.history-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-action-btn:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.history-action-btn--disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 8px;
}

.empty-icon {
  color: var(--text-secondary);
  opacity: 0.5;
}

.empty-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.history-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 8px 0;
}

.history-list::-webkit-scrollbar {
  width: 4px;
}

.history-list::-webkit-scrollbar-track {
  background: transparent;
}

.history-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.history-item:hover {
  background: var(--bg-secondary);
}

.history-item--active {
  background: rgba(212, 168, 83, 0.08);
}

.history-item-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-color);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.history-item--active .history-item-dot {
  background: var(--accent);
  box-shadow: 0 0 8px rgba(212, 168, 83, 0.5);
}

.history-item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
}

.history-item-name {
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.2s ease;
}

.history-item--active .history-item-name {
  color: var(--accent);
  font-weight: 500;
}

.history-item-time {
  font-size: 0.65rem;
  color: var(--text-secondary);
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  margin-left: 8px;
}
</style>
