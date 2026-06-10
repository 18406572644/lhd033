<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { useExport } from '@/composables/useExport'
import { FileText, Image as ImageIcon, Printer, Download, Check, Loader2 } from 'lucide-vue-next'
import { mmToPx } from '@/lib/unitConversion'
import jsPDF from 'jspdf'

const emit = defineEmits<{
  printPreview: []
}>()

const store = usePrintLayoutStore()
const { paper, images, paperPixelWidth, paperPixelHeight } = storeToRefs(store)
const { exporting, exportImage } = useExport()

const isExportingPDF = ref(false)
const isExportingImage = ref(false)
const isPrinting = ref(false)
const exportSuccess = ref<string | null>(null)

function showSuccess(message: string) {
  exportSuccess.value = message
  setTimeout(() => {
    exportSuccess.value = null
  }, 2000)
}

async function handleExportPDF() {
  isExportingPDF.value = true
  try {
    const { jsPDF } = await import('jspdf')
    const dpi = paper.value.dpi
    const widthMm = paper.value.orientation === 'landscape' ? paper.value.size.height : paper.value.size.width
    const heightMm = paper.value.orientation === 'landscape' ? paper.value.size.width : paper.value.size.height

    const pdf = new jsPDF({
      orientation: paper.value.orientation,
      unit: 'mm',
      format: [widthMm, heightMm],
    })

    const canvas = document.createElement('canvas')
    canvas.width = paperPixelWidth.value
    canvas.height = paperPixelHeight.value
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const sortedImages = [...images.value].sort((a, b) => a.zIndex - b.zIndex)
      for (const img of sortedImages) {
        if (!img.src) continue

        await new Promise<void>((resolve) => {
          const image = new Image()
          image.crossOrigin = 'anonymous'
          image.onload = () => {
            ctx.save()
            const x = mmToPx(img.x, dpi)
            const y = mmToPx(img.y, dpi)
            const w = mmToPx(img.width, dpi)
            const h = mmToPx(img.height, dpi)
            const cx = x + w / 2
            const cy = y + h / 2

            ctx.translate(cx, cy)
            ctx.rotate((img.rotation * Math.PI) / 180)
            ctx.translate(-cx, -cy)

            const p = img.filterParams
            const filter = `
              brightness(${p.brightness}%)
              contrast(${p.contrast}%)
              saturate(${p.saturate}%)
              sepia(${p.sepia}%)
              hue-rotate(${p.hueRotate}deg)
            `.trim()
            ctx.filter = filter

            if (img.crop) {
              const sx = (img.crop.x / img.originalWidth) * image.width
              const sy = (img.crop.y / img.originalHeight) * image.height
              const sw = (img.crop.width / img.originalWidth) * image.width
              const sh = (img.crop.height / img.originalHeight) * image.height
              ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h)
            } else {
              ctx.drawImage(image, x, y, w, h)
            }

            if (img.border) {
              ctx.restore()
              ctx.save()
              ctx.translate(cx, cy)
              ctx.rotate((img.rotation * Math.PI) / 180)
              ctx.translate(-cx, -cy)
              ctx.strokeStyle = img.border.color
              ctx.lineWidth = img.border.width * dpi / 25.4
              if (img.border.borderRadius > 0) {
                const radius = img.border.borderRadius * dpi / 25.4
                ctx.beginPath()
                ctx.roundRect(x, y, w, h, radius)
                ctx.stroke()
              } else {
                ctx.strokeRect(x, y, w, h)
              }

              if (img.border.shadow) {
                const s = img.border.shadow
                ctx.shadowColor = s.color
                ctx.shadowBlur = s.blur
                ctx.shadowOffsetX = s.offsetX
                ctx.shadowOffsetY = s.offsetY
                ctx.globalAlpha = s.opacity / 100
              }
            }

            ctx.restore()
            resolve()
          }
          image.onerror = () => resolve()
          image.src = img.src
        })
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(dataUrl, 'JPEG', 0, 0, widthMm, heightMm)
      pdf.save(`${store.projectName || 'print-layout'}-${Date.now()}.pdf`)
      showSuccess('PDF 导出成功')
    }
  } catch (error) {
    console.error('导出 PDF 失败:', error)
  } finally {
    isExportingPDF.value = false
  }
}

async function handleExportImage() {
  isExportingImage.value = true
  try {
    const dpi = paper.value.dpi
    const canvas = document.createElement('canvas')
    canvas.width = paperPixelWidth.value
    canvas.height = paperPixelHeight.value
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const sortedImages = [...images.value].sort((a, b) => a.zIndex - b.zIndex)
      for (const img of sortedImages) {
        if (!img.src) continue

        await new Promise<void>((resolve) => {
          const image = new window.Image()
          image.crossOrigin = 'anonymous'
          image.onload = () => {
            ctx.save()
            const x = mmToPx(img.x, dpi)
            const y = mmToPx(img.y, dpi)
            const w = mmToPx(img.width, dpi)
            const h = mmToPx(img.height, dpi)
            const cx = x + w / 2
            const cy = y + h / 2

            ctx.translate(cx, cy)
            ctx.rotate((img.rotation * Math.PI) / 180)
            ctx.translate(-cx, -cy)

            const p = img.filterParams
            const filter = `
              brightness(${p.brightness}%)
              contrast(${p.contrast}%)
              saturate(${p.saturate}%)
              sepia(${p.sepia}%)
              hue-rotate(${p.hueRotate}deg)
            `.trim()
            ctx.filter = filter

            if (img.crop) {
              const sx = (img.crop.x / img.originalWidth) * image.width
              const sy = (img.crop.y / img.originalHeight) * image.height
              const sw = (img.crop.width / img.originalWidth) * image.width
              const sh = (img.crop.height / img.originalHeight) * image.height
              ctx.drawImage(image, sx, sy, sw, sh, x, y, w, h)
            } else {
              ctx.drawImage(image, x, y, w, h)
            }

            if (img.border) {
              ctx.restore()
              ctx.save()
              ctx.translate(cx, cy)
              ctx.rotate((img.rotation * Math.PI) / 180)
              ctx.translate(-cx, -cy)
              ctx.strokeStyle = img.border.color
              ctx.lineWidth = img.border.width * dpi / 25.4
              if (img.border.borderRadius > 0) {
                const radius = img.border.borderRadius * dpi / 25.4
                ctx.beginPath()
                ctx.roundRect(x, y, w, h, radius)
                ctx.stroke()
              } else {
                ctx.strokeRect(x, y, w, h)
              }
            }

            ctx.restore()
            resolve()
          }
          image.onerror = () => resolve()
          image.src = img.src
        })
      }

      await exportImage(canvas, store.projectName || 'print-layout')
      showSuccess('图片导出成功')
    }
  } catch (error) {
    console.error('导出图片失败:', error)
  } finally {
    isExportingImage.value = false
  }
}

function handleBrowserPrint() {
  emit('printPreview')
}
</script>

<template>
  <div class="export-bar">
    <div class="export-info">
      <span class="info-badge">
        <span class="badge-label">图片数量</span>
        <span class="badge-value">{{ images.length }}</span>
      </span>
      <span class="info-badge">
        <span class="badge-label">纸张尺寸</span>
        <span class="badge-value">{{ paper.size.name }}</span>
      </span>
      <span class="info-badge">
        <span class="badge-label">DPI</span>
        <span class="badge-value">{{ paper.dpi }}</span>
      </span>
    </div>

    <div class="export-actions">
      <button
        class="export-btn secondary"
        :disabled="isExportingImage || images.length === 0"
        @click="handleExportImage"
      >
        <Loader2 v-if="isExportingImage" :size="18" class="spin" />
        <Check v-else-if="exportSuccess === '图片导出成功'" :size="18" />
        <ImageIcon v-else :size="18" />
        <span>导出图片</span>
      </button>

      <button
        class="export-btn secondary"
        :disabled="isExportingPDF || images.length === 0"
        @click="handleExportPDF"
      >
        <Loader2 v-if="isExportingPDF" :size="18" class="spin" />
        <Check v-else-if="exportSuccess === 'PDF 导出成功'" :size="18" />
        <FileText v-else :size="18" />
        <span>导出 PDF</span>
      </button>

      <button
        class="export-btn primary"
        :disabled="isPrinting || images.length === 0"
        @click="handleBrowserPrint"
      >
        <Printer :size="18" />
        <span>打印预览</span>
      </button>
    </div>

    <Transition name="toast">
      <div v-if="exportSuccess" class="success-toast">
        <Check :size="16" />
        <span>{{ exportSuccess }}</span>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.export-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: var(--bg-card);
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -4px 20px var(--shadow);
}

.export-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-secondary);
  border-radius: 9999px;
  border: 1px solid var(--border-color);
}

.badge-label {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.badge-value {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.export-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 9999px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
  font-family: inherit;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn.secondary {
  background: transparent;
  color: var(--text-primary);
}

.export-btn.secondary:hover:not(:disabled) {
  background: var(--bg-secondary);
  border-color: var(--accent);
  box-shadow: 0 0 16px rgba(212, 168, 83, 0.2);
}

.export-btn.primary {
  background: var(--accent);
  color: #1a1614;
  border-color: var(--accent);
  padding: 10px 32px;
  font-weight: 600;
}

.export-btn.primary:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 0 24px rgba(212, 168, 83, 0.4);
  transform: translateY(-1px);
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-toast {
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #27ae60;
  color: white;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(39, 174, 96, 0.4);
  z-index: 10;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
