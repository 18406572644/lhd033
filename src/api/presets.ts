import { FILM_PRESETS } from './mock'
import type { FilmPreset } from '@/types'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchPresets(): Promise<FilmPreset[]> {
  await delay(150)
  return [...FILM_PRESETS]
}

export async function fetchPresetById(id: string): Promise<FilmPreset | undefined> {
  await delay(100)
  return FILM_PRESETS.find(p => p.id === id)
}
