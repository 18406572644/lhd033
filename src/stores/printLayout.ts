import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  PaperConfig,
  PrintImage,
  SmartLayoutConfig,
  PrintPreviewConfig,
  LayoutTemplate,
  GuideLine,
  PaperSize,
  FilterParams,
  BorderConfig,
  CropConfig,
  PrintProject,
} from '@/types'
import { PAPER_SIZES, DEFAULT_FILTER_PARAMS } from '@/types'
import { mmToPx } from '@/lib/unitConversion'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

const defaultPaperConfig: PaperConfig = {
  size: PAPER_SIZES[0],
  orientation: 'portrait',
  margins: { top: 10, right: 10, bottom: 10, left: 10 },
  dpi: 300,
}

const defaultSmartLayout: SmartLayoutConfig = {
  showGuides: true,
  snapToGuides: true,
  showGrid: false,
  gridSize: 5,
  snapToGrid: false,
  guideSensitivity: 5,
}

const defaultPrintPreview: PrintPreviewConfig = {
  paperTexture: 'none',
  textureIntensity: 50,
  inkSimulation: 'none',
  lighting: 'indoor',
  showBleed: false,
  showCropMarks: false,
  bleedSize: 3,
}

export const usePrintLayoutStore = defineStore('printLayout', () => {
  const projectName = ref('未命名项目')
  const projectId = ref<string | null>(null)
  const paper = ref<PaperConfig>({ ...defaultPaperConfig })
  const images = ref<PrintImage[]>([])
  const selectedImageIds = ref<string[]>([])
  const smartLayout = ref<SmartLayoutConfig>({ ...defaultSmartLayout })
  const printPreview = ref<PrintPreviewConfig>({ ...defaultPrintPreview })
  const activeGuides = ref<GuideLine[]>([])
  const zoom = ref(1)
  const canvasOffset = ref({ x: 0, y: 0 })
  const isCropping = ref(false)
  const croppingImageId = ref<string | null>(null)
  const isDragging = ref(false)
  const showPreviewModal = ref(false)
  const activeTab = ref<'settings' | 'templates' | 'properties'>('settings')

  const paperWidth = computed(() =>
    paper.value.orientation === 'landscape'
      ? paper.value.size.height
      : paper.value.size.width,
  )
  const paperHeight = computed(() =>
    paper.value.orientation === 'landscape'
      ? paper.value.size.width
      : paper.value.size.height,
  )

  const paperPixelWidth = computed(() => mmToPx(paperWidth.value, paper.value.dpi))
  const paperPixelHeight = computed(() => mmToPx(paperHeight.value, paper.value.dpi))

  const contentArea = computed(() => ({
    x: paper.value.margins.left,
    y: paper.value.margins.top,
    width: paperWidth.value - paper.value.margins.left - paper.value.margins.right,
    height: paperHeight.value - paper.value.margins.top - paper.value.margins.bottom,
  }))

  const selectedImages = computed(() =>
    images.value.filter((img) => selectedImageIds.value.includes(img.id)),
  )

  const sortedImages = computed(() =>
    [...images.value].sort((a, b) => a.zIndex - b.zIndex),
  )

  const maxZIndex = computed(() =>
    images.value.length > 0 ? Math.max(...images.value.map((i) => i.zIndex)) : 0,
  )

  function setPaperSize(size: PaperSize) {
    paper.value.size = size
  }

  function setOrientation(orientation: 'portrait' | 'landscape') {
    paper.value.orientation = orientation
  }

  function setMargins(margins: Partial<PaperConfig['margins']>) {
    paper.value.margins = { ...paper.value.margins, ...margins }
  }

  function centerMargins() {
    const horizontalMargin = (paperWidth.value - contentArea.value.width) / 2
    const verticalMargin = (paperHeight.value - contentArea.value.height) / 2
    paper.value.margins = {
      top: verticalMargin,
      right: horizontalMargin,
      bottom: verticalMargin,
      left: horizontalMargin,
    }
  }

  function setDpi(dpi: number) {
    paper.value.dpi = dpi
  }

  function addImage(src: string, name: string, originalWidth: number, originalHeight: number) {
    const aspectRatio = originalWidth / originalHeight
    const maxWidth = contentArea.value.width * 0.8
    const maxHeight = contentArea.value.height * 0.8

    let width = maxWidth
    let height = width / aspectRatio

    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }

    const newImage: PrintImage = {
      id: generateId(),
      src,
      name,
      originalWidth,
      originalHeight,
      x: contentArea.value.x + (contentArea.value.width - width) / 2,
      y: contentArea.value.y + (contentArea.value.height - height) / 2,
      width,
      height,
      rotation: 0,
      zIndex: maxZIndex.value + 1,
      crop: null,
      border: null,
      filterParams: { ...DEFAULT_FILTER_PARAMS },
    }

    images.value.push(newImage)
    selectImage(newImage.id)
    return newImage
  }

  function removeImage(id: string) {
    images.value = images.value.filter((img) => img.id !== id)
    selectedImageIds.value = selectedImageIds.value.filter((sid) => sid !== id)
  }

  function selectImage(id: string, multiSelect = false) {
    if (multiSelect) {
      if (selectedImageIds.value.includes(id)) {
        selectedImageIds.value = selectedImageIds.value.filter((sid) => sid !== id)
      } else {
        selectedImageIds.value.push(id)
      }
    } else {
      selectedImageIds.value = [id]
    }
  }

  function clearSelection() {
    selectedImageIds.value = []
  }

  function updateImagePosition(id: string, x: number, y: number) {
    const img = images.value.find((i) => i.id === id)
    if (img) {
      img.x = x
      img.y = y
    }
  }

  function updateImageSize(id: string, width: number, height: number) {
    const img = images.value.find((i) => i.id === id)
    if (img) {
      img.width = width
      img.height = height
    }
  }

  function updateImageRotation(id: string, rotation: number) {
    const img = images.value.find((i) => i.id === id)
    if (img) {
      img.rotation = rotation
    }
  }

  function updateImageFilter(id: string, params: Partial<FilterParams>) {
    const img = images.value.find((i) => i.id === id)
    if (img) {
      img.filterParams = { ...img.filterParams, ...params }
    }
  }

  function updateImageBorder(id: string, border: BorderConfig | null) {
    const img = images.value.find((i) => i.id === id)
    if (img) {
      img.border = border
    }
  }

  function updateImageCrop(id: string, crop: CropConfig | null) {
    const img = images.value.find((i) => i.id === id)
    if (img) {
      img.crop = crop
    }
  }

  function bringToFront(id: string) {
    const maxZ = maxZIndex.value
    const img = images.value.find((i) => i.id === id)
    if (img) {
      img.zIndex = maxZ + 1
    }
  }

  function sendToBack(id: string) {
    const minZ = Math.min(...images.value.map((i) => i.zIndex))
    const img = images.value.find((i) => i.id === id)
    if (img) {
      img.zIndex = minZ - 1
    }
  }

  function applyTemplate(template: LayoutTemplate) {
    paper.value = { ...template.paper }
    images.value = []
    selectedImageIds.value = []

    template.imageSlots.forEach((slot, index) => {
      const placeholder: PrintImage = {
        id: generateId(),
        src: '',
        name: `图片 ${index + 1}`,
        originalWidth: slot.width,
        originalHeight: slot.height,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        rotation: slot.rotation || 0,
        zIndex: index + 1,
        crop: null,
        border: slot.border || null,
        filterParams: { ...DEFAULT_FILTER_PARAMS },
      }
      images.value.push(placeholder)
    })
  }

  function setActiveGuides(guides: GuideLine[]) {
    activeGuides.value = guides
  }

  function clearActiveGuides() {
    activeGuides.value = []
  }

  function setZoom(newZoom: number) {
    zoom.value = Math.max(0.1, Math.min(5, newZoom))
  }

  function resetZoom() {
    zoom.value = 1
    canvasOffset.value = { x: 0, y: 0 }
  }

  function setCanvasOffset(x: number, y: number) {
    canvasOffset.value = { x, y }
  }

  function startCropping(imageId: string) {
    isCropping.value = true
    croppingImageId.value = imageId
  }

  function stopCropping() {
    isCropping.value = false
    croppingImageId.value = null
  }

  function setDragging(value: boolean) {
    isDragging.value = value
  }

  function togglePreviewModal() {
    showPreviewModal.value = !showPreviewModal.value
  }

  function setActiveTab(tab: 'settings' | 'templates' | 'properties') {
    activeTab.value = tab
  }

  function setSmartLayout(config: Partial<SmartLayoutConfig>) {
    smartLayout.value = { ...smartLayout.value, ...config }
  }

  function setPrintPreview(config: Partial<PrintPreviewConfig>) {
    printPreview.value = { ...printPreview.value, ...config }
  }

  function distributeHorizontally() {
    if (selectedImages.value.length < 2) return

    const sorted = [...selectedImages.value].sort((a, b) => a.x - b.x)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalWidth = last.x + last.width - first.x
    const totalItemWidth = sorted.reduce((sum, img) => sum + img.width, 0)
    const gap = (totalWidth - totalItemWidth) / (sorted.length - 1)

    let currentX = first.x
    sorted.forEach((img) => {
      img.x = currentX
      currentX += img.width + gap
    })
  }

  function distributeVertically() {
    if (selectedImages.value.length < 2) return

    const sorted = [...selectedImages.value].sort((a, b) => a.y - b.y)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    const totalHeight = last.y + last.height - first.y
    const totalItemHeight = sorted.reduce((sum, img) => sum + img.height, 0)
    const gap = (totalHeight - totalItemHeight) / (sorted.length - 1)

    let currentY = first.y
    sorted.forEach((img) => {
      img.y = currentY
      currentY += img.height + gap
    })
  }

  function alignLeft() {
    if (selectedImages.value.length === 0) return
    const minX = Math.min(...selectedImages.value.map((i) => i.x))
    selectedImages.value.forEach((img) => {
      img.x = minX
    })
  }

  function alignRight() {
    if (selectedImages.value.length === 0) return
    const maxRight = Math.max(...selectedImages.value.map((i) => i.x + i.width))
    selectedImages.value.forEach((img) => {
      img.x = maxRight - img.width
    })
  }

  function alignCenter() {
    if (selectedImages.value.length === 0) return
    const centerX =
      selectedImages.value.reduce((sum, img) => sum + img.x + img.width / 2, 0) /
      selectedImages.value.length
    selectedImages.value.forEach((img) => {
      img.x = centerX - img.width / 2
    })
  }

  function alignTop() {
    if (selectedImages.value.length === 0) return
    const minY = Math.min(...selectedImages.value.map((i) => i.y))
    selectedImages.value.forEach((img) => {
      img.y = minY
    })
  }

  function alignBottom() {
    if (selectedImages.value.length === 0) return
    const maxBottom = Math.max(...selectedImages.value.map((i) => i.y + i.height))
    selectedImages.value.forEach((img) => {
      img.y = maxBottom - img.height
    })
  }

  function alignMiddle() {
    if (selectedImages.value.length === 0) return
    const centerY =
      selectedImages.value.reduce((sum, img) => sum + img.y + img.height / 2, 0) /
      selectedImages.value.length
    selectedImages.value.forEach((img) => {
      img.y = centerY - img.height / 2
    })
  }

  function sameWidth() {
    if (selectedImages.value.length < 2) return
    const firstWidth = selectedImages.value[0].width
    selectedImages.value.forEach((img) => {
      const ratio = img.height / img.width
      img.width = firstWidth
      img.height = firstWidth * ratio
    })
  }

  function sameHeight() {
    if (selectedImages.value.length < 2) return
    const firstHeight = selectedImages.value[0].height
    selectedImages.value.forEach((img) => {
      const ratio = img.width / img.height
      img.height = firstHeight
      img.width = firstHeight * ratio
    })
  }

  function resetAll() {
    projectName.value = '未命名项目'
    projectId.value = null
    paper.value = { ...defaultPaperConfig }
    images.value = []
    selectedImageIds.value = []
    smartLayout.value = { ...defaultSmartLayout }
    printPreview.value = { ...defaultPrintPreview }
    activeGuides.value = []
    zoom.value = 1
    canvasOffset.value = { x: 0, y: 0 }
    isCropping.value = false
    croppingImageId.value = null
    isDragging.value = false
    showPreviewModal.value = false
    activeTab.value = 'settings'
  }

  function loadProject(project: PrintProject) {
    projectId.value = project.id
    projectName.value = project.name
    paper.value = { ...project.paper }
    images.value = project.images.map((img) => ({ ...img }))
    selectedImageIds.value = []
  }

  function getProjectData(): Omit<PrintProject, 'id' | 'createdAt'> & { id?: string } {
    return {
      id: projectId.value || undefined,
      name: projectName.value,
      paper: { ...paper.value },
      images: images.value.map((img) => ({ ...img })),
    }
  }

  return {
    projectName,
    projectId,
    paper,
    images,
    selectedImageIds,
    smartLayout,
    printPreview,
    activeGuides,
    zoom,
    canvasOffset,
    isCropping,
    croppingImageId,
    isDragging,
    showPreviewModal,
    activeTab,
    paperWidth,
    paperHeight,
    paperPixelWidth,
    paperPixelHeight,
    contentArea,
    selectedImages,
    sortedImages,
    maxZIndex,
    setPaperSize,
    setOrientation,
    setMargins,
    centerMargins,
    setDpi,
    addImage,
    removeImage,
    selectImage,
    clearSelection,
    updateImagePosition,
    updateImageSize,
    updateImageRotation,
    updateImageFilter,
    updateImageBorder,
    updateImageCrop,
    bringToFront,
    sendToBack,
    applyTemplate,
    setActiveGuides,
    clearActiveGuides,
    setZoom,
    resetZoom,
    setCanvasOffset,
    startCropping,
    stopCropping,
    setDragging,
    togglePreviewModal,
    setActiveTab,
    setSmartLayout,
    setPrintPreview,
    distributeHorizontally,
    distributeVertically,
    alignLeft,
    alignRight,
    alignCenter,
    alignTop,
    alignBottom,
    alignMiddle,
    sameWidth,
    sameHeight,
    resetAll,
    loadProject,
    getProjectData,
  }
})
