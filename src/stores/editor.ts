import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterParams, RGBCurves } from '@/types'
import { DEFAULT_PARAMS } from '@/api/mock'

interface HistoryItem {
  id: string
  name: string
  params: FilterParams
  presetId: string | null
  timestamp: number
}

const MAX_HISTORY = 20

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

export const useEditorStore = defineStore('editor', () => {
  const originalImage = ref<string | null>(null)
  const imageName = ref('')
  const params = ref<FilterParams>({ ...DEFAULT_PARAMS })
  const activePresetId = ref<string | null>(null)
  const comparePosition = ref(50)

  const history = ref<HistoryItem[]>([])
  const historyIndex = ref(-1)
  let isNavigatingHistory = false

  const hasImage = computed(() => !!originalImage.value)
  const isModified = computed(() => {
    return JSON.stringify(params.value) !== JSON.stringify(DEFAULT_PARAMS)
  })
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)
  const historyList = computed(() => history.value)
  const currentHistoryIndex = computed(() => historyIndex.value)

  function pushHistory(name: string) {
    if (isNavigatingHistory) return

    const newItem: HistoryItem = {
      id: generateId(),
      name,
      params: { ...params.value },
      presetId: activePresetId.value,
      timestamp: Date.now(),
    }

    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    history.value.push(newItem)

    if (history.value.length > MAX_HISTORY) {
      history.value = history.value.slice(history.value.length - MAX_HISTORY)
    } else {
      historyIndex.value = history.value.length - 1
    }
  }

  function undo() {
    if (!canUndo.value) return
    isNavigatingHistory = true
    historyIndex.value--
    const item = history.value[historyIndex.value]
    params.value = { ...item.params }
    activePresetId.value = item.presetId
    isNavigatingHistory = false
  }

  function redo() {
    if (!canRedo.value) return
    isNavigatingHistory = true
    historyIndex.value++
    const item = history.value[historyIndex.value]
    params.value = { ...item.params }
    activePresetId.value = item.presetId
    isNavigatingHistory = false
  }

  function goToHistory(index: number) {
    if (index < 0 || index >= history.value.length) return
    isNavigatingHistory = true
    historyIndex.value = index
    const item = history.value[index]
    params.value = { ...item.params }
    activePresetId.value = item.presetId
    isNavigatingHistory = false
  }

  function initHistory() {
    history.value = []
    historyIndex.value = -1
    pushHistory('初始状态')
  }

  function setImage(src: string, name: string) {
    originalImage.value = src
    imageName.value = name
    initHistory()
  }

  function setParams(newParams: FilterParams) {
    params.value = { ...newParams }
  }

  function updateParam<K extends keyof FilterParams>(key: K, value: FilterParams[K]) {
    params.value[key] = value
  }

  function commitParamChange<K extends keyof FilterParams>(key: K, value: FilterParams[K]) {
    const oldValue = params.value[key]
    params.value[key] = value
    if (oldValue !== value) {
      pushHistory(`调整${getParamLabel(key)}`)
    }
  }

  function getParamLabel(key: keyof FilterParams): string {
    const labels: Record<keyof FilterParams, string> = {
      brightness: '亮度',
      contrast: '对比度',
      temperature: '色温',
      grain: '颗粒感',
      saturate: '饱和度',
      sepia: '复古',
      hueRotate: '色相',
      shadows: '阴影',
      highlights: '高光',
      clarity: '清晰度',
      vignette: '暗角',
      splitToneShadowHue: '色调分离-阴影色相',
      splitToneShadowSat: '色调分离-阴影饱和度',
      splitToneHighlightHue: '色调分离-高光色相',
      splitToneHighlightSat: '色调分离-高光饱和度',
      rgbCurves: 'RGB曲线',
    }
    return labels[key] || key
  }

  function applyPreset(presetId: string, presetParams: FilterParams) {
    activePresetId.value = presetId
    params.value = { ...presetParams }
    pushHistory(`应用预设`)
  }

  function loadScheme(schemeParams: FilterParams, presetId?: string) {
    params.value = { ...schemeParams }
    if (presetId) {
      activePresetId.value = presetId
    } else {
      activePresetId.value = null
    }
    pushHistory('加载方案')
  }

  function updateRGBCurve(channel: 'r' | 'g' | 'b', points: { x: number; y: number }[]) {
    const curves = { ...params.value.rgbCurves }
    curves[channel] = points.map(p => ({ x: p.x, y: p.y }))
    params.value = { ...params.value, rgbCurves: curves }
  }

  function commitRGBCurveChange(channel: 'r' | 'g' | 'b', points: { x: number; y: number }[]) {
    updateRGBCurve(channel, points)
    pushHistory(`调整${channel.toUpperCase()}曲线`)
  }

  function resetAdvancedParams() {
    params.value = {
      ...params.value,
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
    pushHistory('重置高级参数')
  }

  function resetParams() {
    params.value = { ...DEFAULT_PARAMS }
    activePresetId.value = null
    pushHistory('重置参数')
  }

  function resetAll() {
    originalImage.value = null
    imageName.value = ''
    params.value = { ...DEFAULT_PARAMS }
    activePresetId.value = null
    comparePosition.value = 50
    history.value = []
    historyIndex.value = -1
  }

  function randomizeParams(rangePercent: number = 30) {
    const newParams: FilterParams = { ...DEFAULT_PARAMS }
    const keys = Object.keys(DEFAULT_PARAMS) as (keyof FilterParams)[]

    keys.forEach((key) => {
      if (key === 'rgbCurves') return

      const baseValue = DEFAULT_PARAMS[key] as number
      const range = baseValue * (rangePercent / 100)
      let randomValue = baseValue + (Math.random() - 0.5) * 2 * range

      if (key === 'temperature' || key === 'hueRotate' || key === 'shadows' || key === 'highlights' || key === 'clarity') {
        const absRange = Math.abs(range)
        randomValue = (Math.random() - 0.5) * 2 * absRange
      }

      const minMax = getParamMinMax(key)
      randomValue = Math.max(minMax.min, Math.min(minMax.max, randomValue))
      randomValue = Math.round(randomValue)

      ;(newParams as any)[key] = randomValue
    })

    params.value = newParams
    activePresetId.value = null
    pushHistory('随机调色')
  }

  function getParamMinMax(key: keyof FilterParams): { min: number; max: number } {
    const ranges: Record<keyof FilterParams, { min: number; max: number }> = {
      brightness: { min: 0, max: 200 },
      contrast: { min: 0, max: 200 },
      temperature: { min: -100, max: 100 },
      grain: { min: 0, max: 100 },
      saturate: { min: 0, max: 200 },
      sepia: { min: 0, max: 100 },
      hueRotate: { min: -180, max: 180 },
      shadows: { min: -100, max: 100 },
      highlights: { min: -100, max: 100 },
      clarity: { min: -100, max: 100 },
      vignette: { min: 0, max: 100 },
      splitToneShadowHue: { min: 0, max: 360 },
      splitToneShadowSat: { min: 0, max: 100 },
      splitToneHighlightHue: { min: 0, max: 360 },
      splitToneHighlightSat: { min: 0, max: 100 },
      rgbCurves: { min: 0, max: 255 },
    }
    return ranges[key]
  }

  return {
    originalImage,
    imageName,
    params,
    activePresetId,
    comparePosition,
    hasImage,
    isModified,
    canUndo,
    canRedo,
    historyList,
    currentHistoryIndex,
    setImage,
    setParams,
    updateParam,
    commitParamChange,
    applyPreset,
    loadScheme,
    resetParams,
    resetAll,
    undo,
    redo,
    goToHistory,
    randomizeParams,
    updateRGBCurve,
    commitRGBCurveChange,
    resetAdvancedParams,
  }
})
