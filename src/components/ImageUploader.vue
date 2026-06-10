<script setup lang="ts">
import { ref } from 'vue'
import { Upload, ImagePlus } from 'lucide-vue-next'
import { useEditorStore } from '@/stores/editor'

const emit = defineEmits<{
  uploaded: []
}>()

const editorStore = useEditorStore()
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onClick() {
  fileInput.value?.click()
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) handleFile(file)
  target.value = ''
}

function handleFile(file: File) {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) return
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result as string
    editorStore.setImage(dataUrl, file.name)
    emit('uploaded')
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div
    class="uploader vignette"
    :class="{ 'uploader--dragging': isDragging }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="onClick"
  >
    <div class="uploader__perforations-top"></div>
    <div class="uploader__content">
      <ImagePlus class="uploader__icon-sub" :size="24" />
      <Upload class="uploader__icon" :size="40" />
      <p class="uploader__text">拖拽或点击上传图片</p>
      <p class="uploader__subtitle">支持 JPG / PNG / WebP 格式</p>
    </div>
    <div class="uploader__perforations-bottom"></div>
    <input
      ref="fileInput"
      type="file"
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      class="uploader__input"
      @change="onFileChange"
    />
  </div>
</template>

<style scoped>
.uploader {
  position: relative;
  border: 2px dashed var(--border-color);
  border-radius: 1rem;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: linear-gradient(
    135deg,
    var(--bg-primary) 0%,
    var(--bg-secondary) 100%
  );
  transition: border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
}

.uploader:hover {
  border-color: var(--accent);
  background: linear-gradient(
    135deg,
    var(--bg-secondary) 0%,
    var(--bg-primary) 100%
  );
  box-shadow: 0 0 20px rgba(212, 168, 83, 0.15);
}

.uploader--dragging {
  border-style: solid;
  border-color: var(--accent);
  background: linear-gradient(
    135deg,
    var(--bg-card, var(--bg-secondary)) 0%,
    var(--bg-primary) 100%
  );
  box-shadow: 0 0 30px rgba(212, 168, 83, 0.25);
}

.uploader__perforations-top,
.uploader__perforations-bottom {
  position: absolute;
  left: 12px;
  right: 12px;
  height: 6px;
  background: repeating-linear-gradient(
    90deg,
    var(--border-color) 0px,
    var(--border-color) 6px,
    transparent 6px,
    transparent 14px
  );
  border-radius: 2px;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.uploader:hover .uploader__perforations-top,
.uploader:hover .uploader__perforations-bottom,
.uploader--dragging .uploader__perforations-top,
.uploader--dragging .uploader__perforations-bottom {
  opacity: 1;
}

.uploader--dragging .uploader__perforations-top,
.uploader--dragging .uploader__perforations-bottom {
  background: repeating-linear-gradient(
    90deg,
    var(--accent) 0px,
    var(--accent) 6px,
    transparent 6px,
    transparent 14px
  );
}

.uploader__perforations-top {
  top: 8px;
}

.uploader__perforations-bottom {
  bottom: 8px;
}

.uploader__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.uploader__icon {
  color: var(--accent);
  transition: transform 0.3s ease;
}

.uploader:hover .uploader__icon,
.uploader--dragging .uploader__icon {
  transform: translateY(-4px);
}

.uploader__icon-sub {
  color: var(--text-secondary);
  margin-bottom: 4px;
  transition: color 0.3s ease;
}

.uploader:hover .uploader__icon-sub {
  color: var(--accent);
}

.uploader__text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

.uploader__subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

.uploader__input {
  display: none;
}
</style>
