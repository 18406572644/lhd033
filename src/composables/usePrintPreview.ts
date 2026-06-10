import type { PrintPreviewConfig, PrintProject, PaperConfig } from '@/types'
import { mmToPx } from '@/lib/unitConversion'

export type PaperTextureType = 'glossy' | 'matte' | 'fineart' | 'xuanzhi' | 'none'
export type InkSimulationType = 'inkjet' | 'laser' | 'silver' | 'none'
export type LightingType = 'indoor' | 'window' | 'sunlight'

export interface RenderConfig {
  scale?: number
  showBleed?: boolean
  showCropMarks?: boolean
}

const COLOR_MATRICES: Record<InkSimulationType, number[]> = {
  none: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  inkjet: [0.98, 0.02, 0.01, 0, -5, 0.01, 0.97, 0.02, 0, -3, 0.02, 0.01, 0.96, 0, -8, 0, 0, 0, 1, 0],
  laser: [1.02, -0.01, -0.01, 0, 3, -0.01, 1.03, -0.02, 0, 2, -0.01, -0.01, 1.04, 0, 5, 0, 0, 0, 1, 0],
  silver: [0.95, 0.05, 0.02, 0, -10, 0.02, 0.92, 0.06, 0, -8, 0.01, 0.03, 0.88, 0, -15, 0, 0, 0, 1, 0],
}

const LIGHTING_COLORS: Record<LightingType, { r: number; g: number; b: number; a: number }> = {
  indoor: { r: 255, g: 230, b: 200, a: 0.08 },
  window: { r: 200, g: 220, b: 255, a: 0.06 },
  sunlight: { r: 255, g: 250, b: 220, a: 0.12 },
}

function generateNoise(width: number, height: number, intensity: number, seed: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  let s = seed
  for (let i = 0; i < data.length; i += 4) {
    s = (s * 9301 + 49297) % 233280
    const noise = ((s / 233280) - 0.5) * intensity
    data[i] = 128 + noise
    data[i + 1] = 128 + noise
    data[i + 2] = 128 + noise
    data[i + 3] = 255
  }
  return data
}

function generatePerlinNoise(width: number, height: number, scale: number, intensity: number, seed: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  const octaves = 4
  let s = seed

  function random2(x: number, y: number): number {
    s = (s * 9301 + x * 49297 + y * 233280) % 233280
    return (s / 233280) * 2 - 1
  }

  function smoothNoise(x: number, y: number): number {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = x - ix
    const fy = y - iy

    const sx = fx * fx * (3 - 2 * fx)
    const sy = fy * fy * (3 - 2 * fy)

    const a = random2(ix, iy)
    const b = random2(ix + 1, iy)
    const c = random2(ix, iy + 1)
    const d = random2(ix + 1, iy + 1)

    const ab = a * (1 - sx) + b * sx
    const cd = c * (1 - sx) + d * sx

    return ab * (1 - sy) + cd * sy
  }

  function perlinNoise(x: number, y: number): number {
    let total = 0
    let frequency = 1
    let amplitude = 1
    let maxValue = 0

    for (let i = 0; i < octaves; i++) {
      total += smoothNoise(x * frequency / scale, y * frequency / scale) * amplitude
      maxValue += amplitude
      amplitude *= 0.5
      frequency *= 2
    }

    return total / maxValue
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const noise = perlinNoise(x, y) * intensity
      data[idx] = 128 + noise
      data[idx + 1] = 128 + noise
      data[idx + 2] = 128 + noise
      data[idx + 3] = 255
    }
  }

  return data
}

function generatePaperTexture(
  width: number,
  height: number,
  type: PaperTextureType,
  intensity: number
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  const intensityFactor = intensity / 100

  switch (type) {
    case 'glossy': {
      const noise = generateNoise(width, height, 8 * intensityFactor, 42)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 245 + (noise[i] - 128) * 0.1
        data[i + 1] = 245 + (noise[i + 1] - 128) * 0.1
        data[i + 2] = 245 + (noise[i + 2] - 128) * 0.1
        data[i + 3] = 255
      }
      break
    }
    case 'matte': {
      const noise = generateNoise(width, height, 25 * intensityFactor, 84)
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 240 + (noise[i] - 128) * 0.3
        data[i + 1] = 238 + (noise[i + 1] - 128) * 0.3
        data[i + 2] = 232 + (noise[i + 2] - 128) * 0.3
        data[i + 3] = 255
      }
      break
    }
    case 'fineart': {
      const perlin = generatePerlinNoise(width, height, 6, 40 * intensityFactor, 126)
      const noise = generateNoise(width, height, 15 * intensityFactor, 168)
      for (let i = 0; i < data.length; i += 4) {
        const pVal = (perlin[i] - 128) * 0.4
        const nVal = (noise[i] - 128) * 0.2
        data[i] = 238 + pVal + nVal
        data[i + 1] = 234 + pVal + nVal
        data[i + 2] = 225 + pVal * 0.8 + nVal
        data[i + 3] = 255
      }
      break
    }
    case 'xuanzhi': {
      const perlin1 = generatePerlinNoise(width, height, 8, 50 * intensityFactor, 210)
      const perlin2 = generatePerlinNoise(width, height, 3, 30 * intensityFactor, 252)
      for (let i = 0; i < data.length; i += 4) {
        const p1 = (perlin1[i] - 128) * 0.5
        const p2 = (perlin2[i] - 128) * 0.3
        const fiber = Math.max(0, p1 + p2)
        data[i] = 245 - fiber * 0.6
        data[i + 1] = 240 - fiber * 0.7
        data[i + 2] = 230 - fiber * 0.9
        data[i + 3] = 255
      }
      break
    }
    case 'none':
    default: {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255
        data[i + 1] = 255
        data[i + 2] = 255
        data[i + 3] = 255
      }
      break
    }
  }

  return new ImageData(data, width, height)
}

function applyColorMatrix(imageData: ImageData, matrix: number[]): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const width = imageData.width
  const height = imageData.height

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      const a = data[idx + 3]

      data[idx] = Math.max(0, Math.min(255, matrix[0] * r + matrix[1] * g + matrix[2] * b + matrix[3] * a + matrix[4]))
      data[idx + 1] = Math.max(0, Math.min(255, matrix[5] * r + matrix[6] * g + matrix[7] * b + matrix[8] * a + matrix[9]))
      data[idx + 2] = Math.max(0, Math.min(255, matrix[10] * r + matrix[11] * g + matrix[12] * b + matrix[13] * a + matrix[14]))
      data[idx + 3] = Math.max(0, Math.min(255, matrix[15] * r + matrix[16] * g + matrix[17] * b + matrix[18] * a + matrix[19]))
    }
  }

  return new ImageData(data, width, height)
}

function applyLighting(imageData: ImageData, lighting: LightingType): ImageData {
  const data = new Uint8ClampedArray(imageData.data)
  const color = LIGHTING_COLORS[lighting]
  const width = imageData.width
  const height = imageData.height

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      const dx = x / width - 0.5
      const dy = y / height - 0.5
      const distFromCenter = Math.sqrt(dx * dx + dy * dy)
      const vignetteFactor = 1 - distFromCenter * 0.3

      data[idx] = Math.max(0, Math.min(255, data[idx] * (1 - color.a * vignetteFactor) + color.r * color.a * vignetteFactor))
      data[idx + 1] = Math.max(0, Math.min(255, data[idx + 1] * (1 - color.a * vignetteFactor) + color.g * color.a * vignetteFactor))
      data[idx + 2] = Math.max(0, Math.min(255, data[idx + 2] * (1 - color.a * vignetteFactor) + color.b * color.a * vignetteFactor))
    }
  }

  return new ImageData(data, width, height)
}

function drawBleedLines(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  bleedSizePx: number
) {
  ctx.save()
  ctx.strokeStyle = '#C0392B'
  ctx.lineWidth = 1
  ctx.setLineDash([6, 4])

  ctx.strokeRect(x - bleedSizePx, y - bleedSizePx, width + bleedSizePx * 2, height + bleedSizePx * 2)

  ctx.restore()
}

function drawCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  bleedSizePx: number
) {
  ctx.save()
  ctx.strokeStyle = '#1A1614'
  ctx.lineWidth = 1

  const markLength = Math.min(bleedSizePx * 0.8, 20)
  const offset = bleedSizePx * 0.2

  function drawMark(cx: number, cy: number, type: 'tl' | 'tr' | 'bl' | 'br') {
    ctx.beginPath()
    if (type === 'tl') {
      ctx.moveTo(cx + offset, cy)
      ctx.lineTo(cx + offset + markLength, cy)
      ctx.moveTo(cx, cy + offset)
      ctx.lineTo(cx, cy + offset + markLength)
    } else if (type === 'tr') {
      ctx.moveTo(cx - offset - markLength, cy)
      ctx.lineTo(cx - offset, cy)
      ctx.moveTo(cx, cy + offset)
      ctx.lineTo(cx, cy + offset + markLength)
    } else if (type === 'bl') {
      ctx.moveTo(cx + offset, cy)
      ctx.lineTo(cx + offset + markLength, cy)
      ctx.moveTo(cx, cy - offset - markLength)
      ctx.lineTo(cx, cy - offset)
    } else {
      ctx.moveTo(cx - offset - markLength, cy)
      ctx.lineTo(cx - offset, cy)
      ctx.moveTo(cx, cy - offset - markLength)
      ctx.lineTo(cx, cy - offset)
    }
    ctx.stroke()
  }

  drawMark(x, y, 'tl')
  drawMark(x + width, y, 'tr')
  drawMark(x, y + height, 'bl')
  drawMark(x + width, y + height, 'br')

  ctx.restore()
}

async function loadImages(
  project: PrintProject
): Promise<Map<string, HTMLImageElement>> {
  const imageMap = new Map<string, HTMLImageElement>()
  const promises: Promise<void>[] = []

  for (const img of project.images) {
    if (!img.src) continue
    const promise = new Promise<void>((resolve) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        imageMap.set(img.id, image)
        resolve()
      }
      image.onerror = () => resolve()
      image.src = img.src
    })
    promises.push(promise)
  }

  await Promise.all(promises)
  return imageMap
}

function applyFilterToImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  filterParams: {
    brightness: number
    contrast: number
    temperature: number
    grain: number
    saturate: number
    sepia: number
    hueRotate: number
  }
): ImageData {
  const width = image.naturalWidth
  const height = image.naturalHeight
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.drawImage(image, 0, 0)

  const imageData = tempCtx.getImageData(0, 0, width, height)
  const data = new Uint8ClampedArray(imageData.data)

  const brightness = filterParams.brightness / 100
  const contrast = filterParams.contrast / 100
  const temperature = filterParams.temperature
  const saturate = filterParams.saturate / 100
  const sepia = filterParams.sepia / 100
  const hueRotate = filterParams.hueRotate
  const grainAmount = filterParams.grain

  const contrastAdj = (259 * (contrast * 255 + 255)) / (255 * (259 + (contrast * 255 - 255)))

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

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

    data[i] = Math.max(0, Math.min(255, r))
    data[i + 1] = Math.max(0, Math.min(255, g))
    data[i + 2] = Math.max(0, Math.min(255, b))
  }

  return new ImageData(data, width, height)
}

export function usePrintPreview() {
  async function renderPreview(
    canvas: HTMLCanvasElement,
    project: PrintProject,
    config: PrintPreviewConfig,
    renderConfig: RenderConfig = {}
  ) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { scale = 1, showBleed, showCropMarks } = renderConfig
    const paper = project.paper
    const dpi = paper.dpi

    const paperWidthMm = paper.orientation === 'landscape' ? paper.size.height : paper.size.width
    const paperHeightMm = paper.orientation === 'landscape' ? paper.size.width : paper.size.height

    const bleedSize = config.bleedSize
    const bleedSizePx = mmToPx(bleedSize, dpi) * scale

    const totalWidthPx = mmToPx(paperWidthMm, dpi) * scale + bleedSizePx * 2
    const totalHeightPx = mmToPx(paperHeightMm, dpi) * scale + bleedSizePx * 2

    canvas.width = totalWidthPx
    canvas.height = totalHeightPx

    ctx.clearRect(0, 0, totalWidthPx, totalHeightPx)

    const paperWidthPx = mmToPx(paperWidthMm, dpi) * scale
    const paperHeightPx = mmToPx(paperHeightMm, dpi) * scale
    const paperX = bleedSizePx
    const paperY = bleedSizePx

    const texture = generatePaperTexture(
      Math.ceil(totalWidthPx),
      Math.ceil(totalHeightPx),
      config.paperTexture,
      config.textureIntensity
    )
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = texture.width
    tempCanvas.height = texture.height
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.putImageData(texture, 0, 0)
    ctx.drawImage(tempCanvas, 0, 0)

    const imageMap = await loadImages(project)
    const sortedImages = [...project.images].sort((a, b) => a.zIndex - b.zIndex)

    for (const img of sortedImages) {
      const loadedImage = imageMap.get(img.id)
      if (!loadedImage) continue

      const imgX = bleedSizePx + mmToPx(img.x, dpi) * scale
      const imgY = bleedSizePx + mmToPx(img.y, dpi) * scale
      const imgWidth = mmToPx(img.width, dpi) * scale
      const imgHeight = mmToPx(img.height, dpi) * scale

      ctx.save()
      const centerX = imgX + imgWidth / 2
      const centerY = imgY + imgHeight / 2
      ctx.translate(centerX, centerY)
      ctx.rotate((img.rotation * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)

      const filteredData = applyFilterToImage(ctx, loadedImage, img.filterParams)
      const filteredCanvas = document.createElement('canvas')
      filteredCanvas.width = filteredData.width
      filteredCanvas.height = filteredData.height
      const filteredCtx = filteredCanvas.getContext('2d')!
      filteredCtx.putImageData(filteredData, 0, 0)

      if (img.crop) {
        ctx.beginPath()
        const cropX = bleedSizePx + mmToPx(img.crop.x, dpi) * scale
        const cropY = bleedSizePx + mmToPx(img.crop.y, dpi) * scale
        const cropW = mmToPx(img.crop.width, dpi) * scale
        const cropH = mmToPx(img.crop.height, dpi) * scale
        ctx.rect(cropX, cropY, cropW, cropH)
        ctx.clip()
      }

      if (img.border) {
        ctx.fillStyle = img.border.color
        ctx.fillRect(
          imgX - img.border.width * scale,
          imgY - img.border.width * scale,
          imgWidth + img.border.width * 2 * scale,
          imgHeight + img.border.width * 2 * scale
        )
      }

      ctx.drawImage(filteredCanvas, imgX, imgY, imgWidth, imgHeight)
      ctx.restore()
    }

    const compositeData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    const withInk = applyColorMatrix(compositeData, COLOR_MATRICES[config.inkSimulation])
    ctx.putImageData(withInk, 0, 0)

    const withLighting = applyLighting(
      ctx.getImageData(0, 0, canvas.width, canvas.height),
      config.lighting
    )
    ctx.putImageData(withLighting, 0, 0)

    const displayBleed = showBleed ?? config.showBleed
    const displayCropMarks = showCropMarks ?? config.showCropMarks

    if (displayBleed) {
      drawBleedLines(ctx, paperX, paperY, paperWidthPx, paperHeightPx, bleedSizePx)
    }

    if (displayCropMarks) {
      drawCropMarks(ctx, paperX, paperY, paperWidthPx, paperHeightPx, bleedSizePx)
    }
  }

  function createExportCanvas(
    project: PrintProject,
    config: PrintPreviewConfig
  ): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      renderPreview(canvas, project, config, { scale: 1 }).then(() => {
        resolve(canvas)
      })
    })
  }

  return {
    renderPreview,
    createExportCanvas,
  }
}
