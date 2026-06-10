import { ref, watch, onMounted, type Ref } from 'vue'
import type { FilterParams } from '@/types'

export function useImageFilter(
  canvasRef: Ref<HTMLCanvasElement | null>,
  imageSrc: Ref<string | null>,
  params: Ref<FilterParams>,
) {
  const originalImageData = ref<ImageData | null>(null)
  const isProcessing = ref(false)

  let img = new Image()
  let animFrameId = 0
  let loaded = false

  function loadImage(src: string): Promise<void> {
    return new Promise<void>((resolve) => {
      loaded = false
      img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = canvasRef.value
        if (!canvas) { resolve(); return }
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) { resolve(); return }
        ctx.drawImage(img, 0, 0)
        originalImageData.value = ctx.getImageData(0, 0, canvas.width, canvas.height)
        loaded = true
        resolve()
      }
      img.onerror = () => resolve()
      img.src = src
    })
  }

  function applyFilters() {
    const canvas = canvasRef.value
    const data = originalImageData.value
    if (!canvas || !data || !loaded) return

    isProcessing.value = true
    cancelAnimationFrame(animFrameId)

    animFrameId = requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d')
      if (!ctx) { isProcessing.value = false; return }

      const p = params.value
      const filtered = new ImageData(
        new Uint8ClampedArray(data.data),
        data.width,
        data.height,
      )
      const d = filtered.data

      const brightness = p.brightness / 100
      const contrast = p.contrast / 100
      const temperature = p.temperature
      const saturate = p.saturate / 100
      const sepia = p.sepia / 100
      const hueRotate = p.hueRotate
      const grainAmount = p.grain

      const contrastFactor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255 + contrast * 255 + 255 - 255))
      const cf = (259 * (contrast * 255)) / (255 * (259 * contrast * 255))

      const contrastAdj = (259 * (contrast * 255 + 255)) / (255 * (259 + (contrast * 255 - 255)))

      for (let i = 0; i < d.length; i += 4) {
        let r = d[i]
        let g = d[i + 1]
        let b = d[i + 2]

        r = contrastAdj * (r - 128) + 128
        g = contrastAdj * (g - 128) + 128
        b = contrastAdj * (b - 128) + 128

        r = r * brightness
        g = g * brightness
        b = b * brightness

        if (temperature > 0) {
          r += temperature * 0.8
          b -= temperature * 0.4
        } else {
          b -= temperature * 0.8
          r += temperature * 0.4
        }

        if (sepia > 0) {
          const sr = r * 0.393 + g * 0.769 + b * 0.189
          const sg = r * 0.349 + g * 0.686 + b * 0.168
          const sb = r * 0.272 + g * 0.534 + b * 0.131
          r = r * (1 - sepia) + sr * sepia
          g = g * (1 - sepia) + sg * sepia
          b = b * (1 - sepia) + sb * sepia
        }

        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = gray + (r - gray) * saturate
        g = gray + (g - gray) * saturate
        b = gray + (b - gray) * saturate

        if (hueRotate !== 0) {
          const rad = (hueRotate * Math.PI) / 180
          const cos = Math.cos(rad)
          const sin = Math.sin(rad)
          const nr = (0.213 + 0.787 * cos - 0.213 * sin) * r + (0.715 - 0.715 * cos - 0.715 * sin) * g + (0.072 - 0.072 * cos + 0.928 * sin) * b
          const ng = (0.213 - 0.213 * cos + 0.143 * sin) * r + (0.715 + 0.285 * cos + 0.14 * sin) * g + (0.072 - 0.072 * cos - 0.283 * sin) * b
          const nb = (0.213 - 0.213 * cos - 0.787 * sin) * r + (0.715 - 0.715 * cos + 0.715 * sin) * g + (0.072 + 0.928 * cos + 0.072 * sin) * b
          r = nr
          g = ng
          b = nb
        }

        if (grainAmount > 0) {
          const noise = (Math.random() - 0.5) * grainAmount * 1.2
          r += noise
          g += noise
          b += noise
        }

        d[i] = Math.max(0, Math.min(255, r))
        d[i + 1] = Math.max(0, Math.min(255, g))
        d[i + 2] = Math.max(0, Math.min(255, b))
      }

      ctx.putImageData(filtered, 0, 0)
      isProcessing.value = false
    })
  }

  onMounted(async () => {
    if (imageSrc.value) {
      await loadImage(imageSrc.value)
      applyFilters()
    }
  })

  watch(imageSrc, async (src) => {
    if (src) {
      await loadImage(src)
      applyFilters()
    }
  })

  watch(params, () => {
    applyFilters()
  }, { deep: true })

  return { isProcessing, applyFilters, loadImage }
}
