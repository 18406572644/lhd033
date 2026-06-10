import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterParams } from '@/types'
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
      const baseValue = DEFAULT_PARAMS[key]
      const range = baseValue * (rangePercent / 100)
      let randomValue = baseValue + (Math.random() - 0.5) * 2 * range

      if (key === 'temperature' || key === 'hueRotate') {
        const absRange = Math.abs(range)
        randomValue = (Math.random() - 0.5) * 2 * absRange
      }

      const minMax = getParamMinMax(key)
      randomValue = Math.max(minMax.min, Math.min(minMax.max, randomValue))
      randomValue = Math.round(randomValue)

      newParams[key] = randomValue as FilterParams[typeof key]
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
  }
})
