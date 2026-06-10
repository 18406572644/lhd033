import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FilmCase, SavedScheme } from '@/types'
import { fetchCases } from '@/api/cases'
import { fetchSchemes, createScheme, deleteScheme } from '@/api/schemes'

export const useGalleryStore = defineStore('gallery', () => {
  const filmCases = ref<FilmCase[]>([])
  const savedSchemes = ref<SavedScheme[]>([])
  const loading = ref(false)

  async function loadCases() {
    loading.value = true
    try {
      filmCases.value = await fetchCases()
    } finally {
      loading.value = false
    }
  }

  async function loadSchemes() {
    try {
      savedSchemes.value = await fetchSchemes()
    } catch {
      savedSchemes.value = []
    }
  }

  async function addScheme(scheme: Omit<SavedScheme, 'id' | 'createdAt'>) {
    const created = await createScheme(scheme)
    savedSchemes.value.unshift(created)
    return created
  }

  async function removeScheme(id: string) {
    await deleteScheme(id)
    savedSchemes.value = savedSchemes.value.filter(s => s.id !== id)
  }

  async function init() {
    await Promise.all([loadCases(), loadSchemes()])
  }

  return {
    filmCases,
    savedSchemes,
    loading,
    loadCases,
    loadSchemes,
    addScheme,
    removeScheme,
    init,
  }
})
