const MM_PER_INCH = 25.4
const CM_PER_MM = 0.1
const MM_PER_CM = 10

export function mmToPx(mm: number, dpi: number): number {
  return (mm * dpi) / MM_PER_INCH
}

export function pxToMm(px: number, dpi: number): number {
  return (px * MM_PER_INCH) / dpi
}

export function mmToCm(mm: number): number {
  return mm * CM_PER_MM
}

export function cmToMm(cm: number): number {
  return cm * MM_PER_CM
}

export function mmToInch(mm: number): number {
  return mm / MM_PER_INCH
}

export function inchToMm(inch: number): number {
  return inch * MM_PER_INCH
}

export function pxToCm(px: number, dpi: number): number {
  return mmToCm(pxToMm(px, dpi))
}

export function cmToPx(cm: number, dpi: number): number {
  return mmToPx(cmToMm(cm), dpi)
}

export function pxToInch(px: number, dpi: number): number {
  return mmToInch(pxToMm(px, dpi))
}

export function inchToPx(inch: number, dpi: number): number {
  return mmToPx(inchToMm(inch), dpi)
}

export function convertToMm(value: number, unit: 'mm' | 'cm' | 'inch'): number {
  switch (unit) {
    case 'cm':
      return cmToMm(value)
    case 'inch':
      return inchToMm(value)
    case 'mm':
    default:
      return value
  }
}

export function convertFromMm(mm: number, unit: 'mm' | 'cm' | 'inch'): number {
  switch (unit) {
    case 'cm':
      return mmToCm(mm)
    case 'inch':
      return mmToInch(mm)
    case 'mm':
    default:
      return mm
  }
}

export function formatSize(mm: number, dpi?: number): string {
  const px = dpi ? Math.round(mmToPx(mm, dpi)) : null
  const cm = mmToCm(mm).toFixed(1)
  const inch = mmToInch(mm).toFixed(2)
  return px !== null
    ? `${mm.toFixed(1)}mm (${px}px / ${cm}cm / ${inch}")`
    : `${mm.toFixed(1)}mm (${cm}cm / ${inch}")`
}
