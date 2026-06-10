export interface CurvePoint {
  x: number
  y: number
}

export interface RGBCurves {
  r: CurvePoint[]
  g: CurvePoint[]
  b: CurvePoint[]
}

export interface FilterParams {
  brightness: number
  contrast: number
  temperature: number
  grain: number
  saturate: number
  sepia: number
  hueRotate: number
  shadows: number
  highlights: number
  clarity: number
  vignette: number
  splitToneShadowHue: number
  splitToneShadowSat: number
  splitToneHighlightHue: number
  splitToneHighlightSat: number
  rgbCurves: RGBCurves
}

export interface FilmPreset {
  id: string
  name: string
  brand: string
  description: string
  thumbnail: string
  params: FilterParams
}

export interface SavedScheme {
  id: string
  name: string
  createdAt: string
  thumbnail: string
  params: FilterParams
  presetId?: string
}

export interface FilmCase {
  id: string
  filmName: string
  style: string
  description: string
  image: string
  params: FilterParams
}

export interface PaperSize {
  id: string
  name: string
  width: number
  height: number
  isCustom?: boolean
}

export interface PaperConfig {
  size: PaperSize
  orientation: 'portrait' | 'landscape'
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
  dpi: number
}

export interface CropConfig {
  x: number
  y: number
  width: number
  height: number
}

export interface ShadowConfig {
  offsetX: number
  offsetY: number
  blur: number
  color: string
  opacity: number
}

export interface BorderConfig {
  width: number
  color: string
  borderRadius: number
  shadow: ShadowConfig | null
}

export interface PrintImage {
  id: string
  src: string
  name: string
  originalWidth: number
  originalHeight: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  crop: CropConfig | null
  border: BorderConfig | null
  filterParams: FilterParams
}

export interface ImageSlot {
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  border?: BorderConfig | null
}

export interface LayoutTemplate {
  id: string
  name: string
  category: 'id' | 'polaroid' | 'photowall' | 'comparison' | 'custom'
  thumbnail: string
  description: string
  paper: PaperConfig
  imageSlots: ImageSlot[]
  isCustom?: boolean
  createdAt?: string
}

export interface PrintProject {
  id: string
  name: string
  createdAt: string
  paper: PaperConfig
  images: PrintImage[]
  templateId?: string
}

export interface PrintPreviewConfig {
  paperTexture: 'glossy' | 'matte' | 'fineart' | 'xuanzhi' | 'none'
  textureIntensity: number
  inkSimulation: 'inkjet' | 'laser' | 'silver' | 'none'
  lighting: 'indoor' | 'window' | 'sunlight'
  showBleed: boolean
  showCropMarks: boolean
  bleedSize: number
}

export interface SmartLayoutConfig {
  showGuides: boolean
  snapToGuides: boolean
  showGrid: boolean
  gridSize: number
  snapToGrid: boolean
  guideSensitivity: number
}

export interface ExportConfig {
  format: 'pdf' | 'jpg' | 'png' | 'tiff'
  quality: number
  includeCropMarks: boolean
  colorProfile: 'srgb' | 'adobergb' | 'cmyk'
}

export interface GuideLine {
  type: 'vertical' | 'horizontal'
  position: number
  source: 'margin' | 'center' | 'image'
}

export const DEFAULT_RGB_CURVES: RGBCurves = {
  r: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
  g: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
  b: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }],
}

export const DEFAULT_FILTER_PARAMS: FilterParams = {
  brightness: 100,
  contrast: 100,
  temperature: 0,
  grain: 0,
  saturate: 100,
  sepia: 0,
  hueRotate: 0,
  shadows: 0,
  highlights: 0,
  clarity: 0,
  vignette: 0,
  splitToneShadowHue: 0,
  splitToneShadowSat: 0,
  splitToneHighlightHue: 0,
  splitToneHighlightSat: 0,
  rgbCurves: { r: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }], g: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }], b: [{ x: 0, y: 0 }, { x: 128, y: 128 }, { x: 255, y: 255 }] },
}

export const PAPER_SIZES: PaperSize[] = [
  { id: 'a4', name: 'A4', width: 210, height: 297 },
  { id: 'a3', name: 'A3', width: 297, height: 420 },
  { id: 'letter', name: 'Letter', width: 215.9, height: 279.4 },
  { id: '6inch', name: '6 寸相纸', width: 102, height: 152 },
  { id: '5inch', name: '5 寸相纸', width: 89, height: 127 },
  { id: 'a5', name: 'A5', width: 148, height: 210 },
  { id: 'b5', name: 'B5', width: 176, height: 250 },
]

export const DPI_OPTIONS = [150, 300, 600]
