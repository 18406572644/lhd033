import { ref } from 'vue'
import jsPDF from 'jspdf'
import type { PrintProject, PrintPreviewConfig, PaperConfig } from '@/types'
import { mmToPx } from '@/lib/unitConversion'
import { usePrintPreview } from './usePrintPreview'

export type ImageFormat = 'jpg' | 'png'

export interface PdfExportConfig {
  includeCropMarks?: boolean
  quality?: number
}

export interface ImageExportConfig {
  quality?: number
}

const MM_PER_INCH = 25.4

function getPaperDimensions(paper: PaperConfig): { width: number; height: number } {
  if (paper.orientation === 'landscape') {
    return {
      width: paper.size.height,
      height: paper.size.width,
    }
  }
  return {
    width: paper.size.width,
    height: paper.size.height,
  }
}

function addCropMarksToPdf(
  doc: jsPDF,
  pageWidth: number,
  pageHeight: number,
  bleedSize: number
) {
  const markLength = Math.min(bleedSize * 0.8, 10)
  const offset = bleedSize * 0.2

  doc.setDrawColor(26, 22, 20)
  doc.setLineWidth(0.1)

  function drawMark(x: number, y: number, type: 'tl' | 'tr' | 'bl' | 'br') {
    if (type === 'tl') {
      doc.line(x + offset, y, x + offset + markLength, y)
      doc.line(x, y + offset, x, y + offset + markLength)
    } else if (type === 'tr') {
      doc.line(x - offset - markLength, y, x - offset, y)
      doc.line(x, y + offset, x, y + offset + markLength)
    } else if (type === 'bl') {
      doc.line(x + offset, y, x + offset + markLength, y)
      doc.line(x, y - offset - markLength, x, y - offset)
    } else {
      doc.line(x - offset - markLength, y, x - offset, y)
      doc.line(x, y - offset - markLength, x, y - offset)
    }
  }

  drawMark(0, 0, 'tl')
  drawMark(pageWidth, 0, 'tr')
  drawMark(0, pageHeight, 'bl')
  drawMark(pageWidth, pageHeight, 'br')
}

function canvasToBlob(canvas: HTMLCanvasElement, format: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      format,
      quality
    )
  })
}

async function canvasToDataUrl(canvas: HTMLCanvasElement, format: string, quality: number): Promise<string> {
  const blob = await canvasToBlob(canvas, format, quality)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function usePdfExport() {
  const exporting = ref(false)
  const progress = ref(0)
  const { createExportCanvas } = usePrintPreview()

  async function exportToPdf(
    project: PrintProject,
    config: PrintPreviewConfig,
    exportConfig: PdfExportConfig = {}
  ): Promise<void> {
    exporting.value = true
    progress.value = 0

    try {
      const { includeCropMarks = false, quality = 0.95 } = exportConfig
      const paper = project.paper
      const dpi = paper.dpi

      const { width: pageWidthMm, height: pageHeightMm } = getPaperDimensions(paper)
      const bleedSize = config.bleedSize

      const pdfWidth = pageWidthMm + bleedSize * 2
      const pdfHeight = pageHeightMm + bleedSize * 2

      const doc = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        compress: true,
      })

      progress.value = 20

      const canvas = await createExportCanvas(project, {
        ...config,
        showCropMarks: false,
        showBleed: false,
      })

      progress.value = 60

      const imgData = await canvasToDataUrl(canvas, 'image/jpeg', quality)

      progress.value = 80

      const imgWidthMm = pdfWidth
      const imgHeightMm = pdfHeight

      doc.addImage(
        imgData,
        'JPEG',
        0,
        0,
        imgWidthMm,
        imgHeightMm,
        undefined,
        'FAST'
      )

      if (includeCropMarks) {
        addCropMarksToPdf(doc, pdfWidth, pdfHeight, bleedSize)
      }

      const filename = `${project.name || 'print-project'}-${Date.now()}.pdf`
      doc.save(filename)

      progress.value = 100
    } catch (error) {
      console.error('PDF export failed:', error)
      throw error
    } finally {
      exporting.value = false
    }
  }

  async function exportToImage(
    project: PrintProject,
    config: PrintPreviewConfig,
    format: ImageFormat = 'png',
    exportConfig: ImageExportConfig = {}
  ): Promise<void> {
    exporting.value = true
    progress.value = 0

    try {
      const { quality = 0.95 } = exportConfig

      progress.value = 20

      const canvas = await createExportCanvas(project, config)

      progress.value = 60

      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
      const blob = await canvasToBlob(canvas, mimeType, quality)

      progress.value = 90

      const ext = format === 'jpg' ? 'jpg' : 'png'
      const filename = `${project.name || 'print-project'}-${Date.now()}.${ext}`
      downloadFile(blob, filename)

      progress.value = 100
    } catch (error) {
      console.error('Image export failed:', error)
      throw error
    } finally {
      exporting.value = false
    }
  }

  function browserPrint(project: PrintProject): void {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('请允许弹出窗口以进行打印')
      return
    }

    const { width: pageWidthMm, height: pageHeightMm } = getPaperDimensions(project.paper)

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${project.name || 'Print Project'}</title>
        <style>
          @page {
            size: ${pageWidthMm}mm ${pageHeightMm}mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            width: ${pageWidthMm}mm;
            height: ${pageHeightMm}mm;
          }
          .print-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .print-content {
            width: ${pageWidthMm - 20}mm;
            height: ${pageHeightMm - 20}mm;
          }
          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <div class="print-content" id="print-content">
            ${project.images
              .map((img) => {
                const widthPercent = (img.width / pageWidthMm) * 100
                const heightPercent = (img.height / pageHeightMm) * 100
                const leftPercent = (img.x / pageWidthMm) * 100
                const topPercent = (img.y / pageHeightMm) * 100
                return `
                  <img 
                    src="${img.src}" 
                    style="
                      position: absolute;
                      width: ${widthPercent}%;
                      height: ${heightPercent}%;
                      left: ${leftPercent}%;
                      top: ${topPercent}%;
                      transform: rotate(${img.rotation}deg);
                      object-fit: contain;
                    "
                    alt="${img.name}"
                  />
                `
              })
              .join('')}
          </div>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print()
              window.close()
            }, 500)
          }
        <\/script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(content)
    printWindow.document.close()
  }

  return {
    exporting,
    progress,
    exportToPdf,
    exportToImage,
    browserPrint,
  }
}
