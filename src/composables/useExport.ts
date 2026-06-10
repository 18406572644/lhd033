import { ref } from 'vue'

export function useExport() {
  const exporting = ref(false)

  async function exportImage(canvas: HTMLCanvasElement, filename: string) {
    exporting.value = true
    try {
      return new Promise<void>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Export failed')); return }
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `film-lab-${filename || 'photo'}-${Date.now()}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          resolve()
        }, 'image/png')
      })
    } finally {
      exporting.value = false
    }
  }

  return { exporting, exportImage }
}
