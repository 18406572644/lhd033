import type { SavedScheme } from '@/types'

const STORAGE_KEY = 'film-lab-schemes'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function loadSchemes(): SavedScheme[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSchemes(schemes: SavedScheme[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schemes))
}

export async function fetchSchemes(): Promise<SavedScheme[]> {
  await delay(150)
  return loadSchemes()
}

export async function createScheme(scheme: Omit<SavedScheme, 'id' | 'createdAt'>): Promise<SavedScheme> {
  await delay(200)
  const newScheme: SavedScheme = {
    ...scheme,
    id: `scheme-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  const schemes = loadSchemes()
  schemes.unshift(newScheme)
  saveSchemes(schemes)
  return newScheme
}

export async function deleteScheme(id: string): Promise<boolean> {
  await delay(150)
  const schemes = loadSchemes()
  const filtered = schemes.filter(s => s.id !== id)
  saveSchemes(filtered)
  return filtered.length < schemes.length
}
