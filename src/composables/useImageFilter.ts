import { ref, watch, onMounted, type Ref } from 'vue'
import type { FilterParams, CurvePoint } from '@/types'

function interpolateCurve(points: CurvePoint[], input: number): number {
  if (points.length === 0) return input
  if (points.length === 1) return points[0].y

  const sorted = [...points].sort((a, b) => a.x - b.x)

  if (input <= sorted[0].x) return sorted[0].y
  if (input >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y

  let lo = 0
  let hi = sorted.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].x <= input) lo = mid
    else hi = mid
  }

  const p0 = sorted[lo]
  const p1 = sorted[hi]
  const t = (input - p0.x) / (p1.x - p0.x)

  const t2 = t * t
  const t3 = t2 * t
  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2

  const dx = p1.x - p0.x
  const m0 = lo > 0 ? (p1.y - sorted[lo - 1].y) / (p1.x - sorted[lo - 1].x) * dx : (p1.y - p0.y)
  const m1 = hi < sorted.length - 1 ? (sorted[hi + 1].y - p0.y) / (sorted[hi + 1].x - p0.x) * dx : (p1.y - p0.y)

  return h00 * p0.y + h10 * m0 + h01 * p1.y + h11 * m1
}

function buildCurveLUT(points: CurvePoint[]): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.max(0, Math.min(255, Math.round(interpolateCurve(points, i))))
  }
  return lut
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = h / 360
  if (s === 0) return [l * 255, l * 255, l * 255]
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6
  return [h * 360, s, l]
}

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
      const w = data.width
      const h = data.height

      const brightness = p.brightness / 100
      const contrast = p.contrast / 100
      const temperature = p.temperature
      const saturate = p.saturate / 100
      const sepia = p.sepia / 100
      const hueRotate = p.hueRotate
      const grainAmount = p.grain

      const shadowsAdj = p.shadows
      const highlightsAdj = p.highlights
      const clarityAdj = p.clarity
      const vignetteAdj = p.vignette / 100

      const stShadowHue = p.splitToneShadowHue
      const stShadowSat = p.splitToneShadowSat / 100
      const stHighlightHue = p.splitToneHighlightHue
      const stHighlightSat = p.splitToneHighlightSat / 100

      const contrastAdj = (259 * (contrast * 255 + 255)) / (255 * (259 + (contrast * 255 - 255)))

      const curveLUT_r = buildCurveLUT(p.rgbCurves.r)
      const curveLUT_g = buildCurveLUT(p.rgbCurves.g)
      const curveLUT_b = buildCurveLUT(p.rgbCurves.b)
      const hasRGBCurves = p.rgbCurves.r.some(pt => pt.y !== pt.x) ||
        p.rgbCurves.g.some(pt => pt.y !== pt.x) ||
        p.rgbCurves.b.some(pt => pt.y !== pt.x)

      const cx = w / 2
      const cy = h / 2
      const maxDist = Math.sqrt(cx * cx + cy * cy)

      const needsSplitTone = stShadowSat > 0 || stHighlightSat > 0
      const needsShadowHighlight = shadowsAdj !== 0 || highlightsAdj !== 0
      const needsClarity = clarityAdj !== 0
      const needsVignette = vignetteAdj > 0

      let blurBuffer: Float32Array | null = null
      if (needsClarity) {
        const radius = 3
        const temp = new Float32Array(w * h * 3)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let sr = 0, sg = 0, sb = 0, count = 0
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                const nx = Math.min(w - 1, Math.max(0, x + dx))
                const ny = Math.min(h - 1, Math.max(0, y + dy))
                const ni = (ny * w + nx) * 4
                sr += data.data[ni]
                sg += data.data[ni + 1]
                sb += data.data[ni + 2]
                count++
              }
            }
            const idx = (y * w + x) * 3
            temp[idx] = sr / count
            temp[idx + 1] = sg / count
            temp[idx + 2] = sb / count
          }
        }
        blurBuffer = temp
      }

      for (let i = 0; i < d.length; i += 4) {
        const pixelIndex = i / 4
        const px = pixelIndex % w
        const py = (pixelIndex / w) | 0

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

        if (needsShadowHighlight) {
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255

          if (shadowsAdj !== 0) {
            const shadowWeight = Math.max(0, 1 - lum * 2)
            const shadowLift = shadowsAdj * shadowWeight * 0.8
            r += shadowLift
            g += shadowLift
            b += shadowLift
          }

          if (highlightsAdj !== 0) {
            const highlightWeight = Math.max(0, lum * 2 - 1)
            const highlightShift = highlightsAdj * highlightWeight * 0.8
            r += highlightShift
            g += highlightShift
            b += highlightShift
          }
        }

        if (needsClarity && blurBuffer) {
          const bIdx = (py * w + px) * 3
          const blurR = blurBuffer[bIdx]
          const blurG = blurBuffer[bIdx + 1]
          const blurB = blurBuffer[bIdx + 2]
          const amount = clarityAdj / 100
          r = r + (r - blurR) * amount
          g = g + (g - blurG) * amount
          b = b + (b - blurB) * amount
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

        if (needsSplitTone) {
          const lum2 = (0.299 * r + 0.587 * g + 0.114 * b) / 255

          if (stShadowSat > 0 && lum2 < 0.5) {
            const weight = (0.5 - lum2) * 2
            const [sr2, sg2, sb2] = hslToRgb(stShadowHue, stShadowSat, lum2 * 0.8)
            r = r * (1 - weight * stShadowSat) + sr2 * weight * stShadowSat
            g = g * (1 - weight * stShadowSat) + sg2 * weight * stShadowSat
            b = b * (1 - weight * stShadowSat) + sb2 * weight * stShadowSat
          }

          if (stHighlightSat > 0 && lum2 >= 0.5) {
            const weight = (lum2 - 0.5) * 2
            const [hr, hg, hb] = hslToRgb(stHighlightHue, stHighlightSat, lum2)
            r = r * (1 - weight * stHighlightSat) + hr * weight * stHighlightSat
            g = g * (1 - weight * stHighlightSat) + hg * weight * stHighlightSat
            b = b * (1 - weight * stHighlightSat) + hb * weight * stHighlightSat
          }
        }

        if (hasRGBCurves) {
          r = curveLUT_r[Math.max(0, Math.min(255, Math.round(r)))]
          g = curveLUT_g[Math.max(0, Math.min(255, Math.round(g)))]
          b = curveLUT_b[Math.max(0, Math.min(255, Math.round(b)))]
        }

        if (grainAmount > 0) {
          const noise = (Math.random() - 0.5) * grainAmount * 1.2
          r += noise
          g += noise
          b += noise
        }

        if (needsVignette) {
          const dx = px - cx
          const dy = py - cy
          const dist = Math.sqrt(dx * dx + dy * dy) / maxDist
          const vignetteWeight = 1 - Math.pow(dist, 1.5) * vignetteAdj
          r *= vignetteWeight
          g *= vignetteWeight
          b *= vignetteWeight
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
