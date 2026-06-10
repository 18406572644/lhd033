<script setup lang="ts">
import { ref } from 'vue'
import { Save, X } from 'lucide-vue-next'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  save: [name: string]
  close: []
}>()

const schemeName = ref('')

function onConfirm() {
  const name = schemeName.value.trim()
  if (!name) return
  emit('save', name)
  schemeName.value = ''
}

function onClose() {
  schemeName.value = ''
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="props.visible" class="modal-overlay" @click.self="onClose">
        <div class="modal-card">
          <div class="modal-header">
            <div class="modal-title-row">
              <Save :size="18" class="modal-icon" />
              <span class="modal-title">保存调色方案</span>
            </div>
            <button class="modal-close" @click="onClose">
              <X :size="16" />
            </button>
          </div>
          <div class="modal-body">
            <label class="modal-label">方案名称</label>
            <input
              v-model="schemeName"
              type="text"
              class="modal-input"
              placeholder="为你的调色方案命名..."
              maxlength="30"
              @keyup.enter="onConfirm"
            />
          </div>
          <div class="modal-footer">
            <button class="btn-film btn-film-secondary" @click="onClose">取消</button>
            <button
              class="btn-film btn-film-primary"
              :disabled="!schemeName.trim()"
              @click="onConfirm"
            >
              <Save :size="14" />
              保存
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
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

.modal-input {
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

.modal-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(212, 168, 83, 0.15);
}

.modal-input::placeholder {
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
