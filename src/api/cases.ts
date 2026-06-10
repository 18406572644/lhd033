import type { FilmCase } from '@/types'
import { FILM_CASES } from './mock'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchCases(): Promise<FilmCase[]> {
  await delay(200)
  return [...FILM_CASES]
}
