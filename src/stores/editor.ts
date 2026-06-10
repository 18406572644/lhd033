import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FilterParams } from '@/types'
import { DEFAULT_PARAMS } from '@/api/mock'

export const useEditorStore = defineStore('editor', () => {
  const originalImage = ref<string | null>(null)
  const imageName = ref('')
  const params = ref<FilterParams>({ ...DEFAULT_PARAMS })
  const activePresetId = ref<string | null>(null)
  const comparePosition = ref(50)

  const hasImage = computed(() => !!originalImage.value)
  const isModified = computed(() => {
    return JSON.stringify(params.value) !== JSON.stringify(DEFAULT_PARAMS)
  })

  function setImage(src: string, name: string) {
    originalImage.value = src
    imageName.value = name
  }

  function setParams(newParams: FilterParams) {
    params.value = { ...newParams }
  }

  function updateParam<K extends keyof FilterParams>(key: K, value: FilterParams[K]) {
    params.value[key] = value
  }

  function applyPreset(presetId: string, presetParams: FilterParams) {
    activePresetId.value = presetId
    params.value = { ...presetParams }
  }

  function resetParams() {
    params.value = { ...DEFAULT_PARAMS }
    activePresetId.value = null
  }

  function resetAll() {
    originalImage.value = null
    imageName.value = ''
    params.value = { ...DEFAULT_PARAMS }
    activePresetId.value = null
    comparePosition.value = 50
  }

  return {
    originalImage,
    imageName,
    params,
    activePresetId,
    comparePosition,
    hasImage,
    isModified,
    setImage,
    setParams,
    updateParam,
    applyPreset,
    resetParams,
    resetAll,
  }
})
