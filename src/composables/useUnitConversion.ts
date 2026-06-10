import { ref, computed } from 'vue'
import {
  mmToPx,
  pxToMm,
  mmToCm,
  cmToMm,
  mmToInch,
  inchToMm,
  convertToMm,
  convertFromMm,
  formatSize,
} from '@/lib/unitConversion'

export function useUnitConversion(dpi: { value: number } | number = 300) {
  const currentDpi = typeof dpi === 'number' ? ref(dpi) : dpi
  const currentUnit = ref<'mm' | 'cm' | 'inch'>('mm')

  const toPx = (mm: number): number => mmToPx(mm, currentDpi.value)
  const fromPx = (px: number): number => pxToMm(px, currentDpi.value)
  const toCm = mmToCm
  const fromCm = cmToMm
  const toInch = mmToInch
  const fromInch = inchToMm

  const toMm = (value: number, unit: 'mm' | 'cm' | 'inch' = currentUnit.value): number =>
    convertToMm(value, unit)

  const fromMm = (mm: number, unit: 'mm' | 'cm' | 'inch' = currentUnit.value): number =>
    convertFromMm(mm, unit)

  const format = (mm: number, showPx = true): string =>
    formatSize(mm, showPx ? currentDpi.value : undefined)

  const displayValue = computed(() => ({
    unit: currentUnit.value,
    label: currentUnit.value === 'mm' ? '毫米' : currentUnit.value === 'cm' ? '厘米' : '英寸',
  }))

  return {
    currentDpi,
    currentUnit,
    toPx,
    fromPx,
    toCm,
    fromCm,
    toInch,
    fromInch,
    toMm,
    fromMm,
    format,
    displayValue,
  }
}
