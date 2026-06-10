import { LAYOUT_TEMPLATES, PAPER_SIZES } from './mock'
import type { LayoutTemplate, PaperSize } from '@/types'

const STORAGE_KEY_CUSTOM_TEMPLATES = 'print_layout_custom_templates'

export async function fetchTemplates(): Promise<LayoutTemplate[]> {
  const customTemplates = loadCustomTemplates()
  return [...LAYOUT_TEMPLATES, ...customTemplates]
}

export async function fetchTemplatesByCategory(
  category: LayoutTemplate['category'],
): Promise<LayoutTemplate[]> {
  const allTemplates = await fetchTemplates()
  return allTemplates.filter((t) => t.category === category)
}

export async function saveCustomTemplate(
  template: Omit<LayoutTemplate, 'id' | 'isCustom' | 'createdAt'>,
): Promise<LayoutTemplate> {
  const customTemplates = loadCustomTemplates()
  const newTemplate: LayoutTemplate = {
    ...template,
    id: `custom-${Date.now().toString(36)}`,
    isCustom: true,
    createdAt: new Date().toISOString(),
  }
  customTemplates.push(newTemplate)
  saveCustomTemplates(customTemplates)
  return newTemplate
}

export async function deleteCustomTemplate(id: string): Promise<void> {
  const customTemplates = loadCustomTemplates()
  const filtered = customTemplates.filter((t) => t.id !== id)
  saveCustomTemplates(filtered)
}

export async function fetchPaperSizes(): Promise<PaperSize[]> {
  return [...PAPER_SIZES]
}

function loadCustomTemplates(): LayoutTemplate[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_CUSTOM_TEMPLATES)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveCustomTemplates(templates: LayoutTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_TEMPLATES, JSON.stringify(templates))
  } catch {
    console.error('Failed to save custom templates')
  }
}

export async function generateTemplateThumbnail(
  template: LayoutTemplate,
): Promise<string> {
  const canvas = document.createElement('canvas')
  const scale = 0.5
  const { paper, imageSlots } = template

  const paperWidth = paper.orientation === 'landscape' ? paper.size.height : paper.size.width
  const paperHeight = paper.orientation === 'landscape' ? paper.size.width : paper.size.height

  canvas.width = paperWidth * scale
  canvas.height = paperHeight * scale

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 1
  imageSlots.forEach((slot) => {
    ctx.strokeRect(
      slot.x * scale,
      slot.y * scale,
      slot.width * scale,
      slot.height * scale,
    )
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)'
    ctx.fillRect(
      slot.x * scale + 2,
      slot.y * scale + 2,
      slot.width * scale - 4,
      slot.height * scale - 4,
    )
  })

  return canvas.toDataURL('image/png')
}
