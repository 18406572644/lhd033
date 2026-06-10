import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { PrintImage, GuideLine } from '@/types'
import { usePrintLayoutStore } from '@/stores/printLayout'
import { mmToPx, pxToMm } from '@/lib/unitConversion'

export type HandleType =
  | 'move'
  | 'rotate'
  | 'nw'
  | 'n'
  | 'ne'
  | 'e'
  | 'se'
  | 's'
  | 'sw'
  | 'w'

export interface DragStartPos {
  x: number
  y: number
  imageX: number
  imageY: number
  imageWidth: number
  imageHeight: number
  imageRotation: number
  imageCenterX: number
  imageCenterY: number
}

export interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
}

export function usePrintLayout() {
  const store = usePrintLayoutStore()

  const {
    paper,
    images,
    selectedImageIds,
    smartLayout,
    activeGuides: storeActiveGuides,
    zoom,
    canvasOffset,
    contentArea,
    paperWidth,
    paperHeight,
  } = storeToRefs(store)

  const isDragging = ref(false)
  const activeHandle = ref<HandleType | null>(null)
  const dragStartPos = ref<DragStartPos | null>(null)
  const activeImageIds = ref<string[]>([])
  const selectionBox = ref<SelectionBox | null>(null)
  const isSelecting = ref(false)

  const dpi = computed(() => paper.value.dpi)

  const toPx = (mm: number): number => mmToPx(mm, dpi.value)
  const fromPx = (px: number): number => pxToMm(px, dpi.value)

  const activeGuides = computed(() => storeActiveGuides.value)

  const getEventCoords = (e: MouseEvent | TouchEvent): { x: number; y: number } => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
  }

  const getCanvasCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    return {
      x: fromPx((clientX - canvasOffset.value.x) / zoom.value),
      y: fromPx((clientY - canvasOffset.value.y) / zoom.value),
    }
  }

  const getImageEdges = (img: PrintImage) => {
    const centerX = img.x + img.width / 2
    const centerY = img.y + img.height / 2
    const rad = (img.rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const hw = img.width / 2
    const hh = img.height / 2

    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ].map((p) => ({
      x: centerX + p.x * cos - p.y * sin,
      y: centerY + p.x * sin + p.y * cos,
    }))

    const xs = corners.map((c) => c.x)
    const ys = corners.map((c) => c.y)

    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys),
      centerX,
      centerY,
    }
  }

  const snapToGrid = (value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize
  }

  const detectGuides = (
    currentImg: PrintImage,
    newX: number,
    newY: number,
    newWidth: number,
    newHeight: number,
  ): { x: number; y: number; guides: GuideLine[] } => {
    const guides: GuideLine[] = []
    let snappedX = newX
    let snappedY = newY
    const sensitivity = smartLayout.value.guideSensitivity

    const tempImg = { ...currentImg, x: newX, y: newY, width: newWidth, height: newHeight }
    const currentEdges = getImageEdges(tempImg)

    const marginLeft = contentArea.value.x
    const marginRight = contentArea.value.x + contentArea.value.width
    const marginTop = contentArea.value.y
    const marginBottom = contentArea.value.y + contentArea.value.height
    const centerX = paperWidth.value / 2
    const centerY = paperHeight.value / 2

    const marginGuides = [
      { type: 'vertical' as const, pos: marginLeft, source: 'margin' as const },
      { type: 'vertical' as const, pos: marginRight, source: 'margin' as const },
      { type: 'horizontal' as const, pos: marginTop, source: 'margin' as const },
      { type: 'horizontal' as const, pos: marginBottom, source: 'margin' as const },
      { type: 'vertical' as const, pos: centerX, source: 'center' as const },
      { type: 'horizontal' as const, pos: centerY, source: 'center' as const },
    ]

    for (const guide of marginGuides) {
      if (guide.type === 'vertical') {
        if (Math.abs(currentEdges.left - guide.pos) < sensitivity) {
          snappedX += guide.pos - currentEdges.left
          guides.push({ type: 'vertical', position: guide.pos, source: guide.source })
        } else if (Math.abs(currentEdges.right - guide.pos) < sensitivity) {
          snappedX += guide.pos - currentEdges.right
          guides.push({ type: 'vertical', position: guide.pos, source: guide.source })
        } else if (Math.abs(currentEdges.centerX - guide.pos) < sensitivity) {
          snappedX += guide.pos - currentEdges.centerX
          guides.push({ type: 'vertical', position: guide.pos, source: guide.source })
        }
      } else {
        if (Math.abs(currentEdges.top - guide.pos) < sensitivity) {
          snappedY += guide.pos - currentEdges.top
          guides.push({ type: 'horizontal', position: guide.pos, source: guide.source })
        } else if (Math.abs(currentEdges.bottom - guide.pos) < sensitivity) {
          snappedY += guide.pos - currentEdges.bottom
          guides.push({ type: 'horizontal', position: guide.pos, source: guide.source })
        } else if (Math.abs(currentEdges.centerY - guide.pos) < sensitivity) {
          snappedY += guide.pos - currentEdges.centerY
          guides.push({ type: 'horizontal', position: guide.pos, source: guide.source })
        }
      }
    }

    for (const otherImg of images.value) {
      if (otherImg.id === currentImg.id) continue
      if (selectedImageIds.value.includes(otherImg.id)) continue

      const otherEdges = getImageEdges(otherImg)

      const imageGuides = [
        { type: 'vertical' as const, pos: otherEdges.left, source: 'image' as const },
        { type: 'vertical' as const, pos: otherEdges.right, source: 'image' as const },
        { type: 'horizontal' as const, pos: otherEdges.top, source: 'image' as const },
        { type: 'horizontal' as const, pos: otherEdges.bottom, source: 'image' as const },
        { type: 'vertical' as const, pos: otherEdges.centerX, source: 'image' as const },
        { type: 'horizontal' as const, pos: otherEdges.centerY, source: 'image' as const },
      ]

      for (const guide of imageGuides) {
        if (guide.type === 'vertical') {
          if (Math.abs(currentEdges.left - guide.pos) < sensitivity) {
            if (!guides.some((g) => g.type === 'vertical' && Math.abs(g.position - guide.pos) < 0.1)) {
              snappedX += guide.pos - currentEdges.left
              guides.push({ type: 'vertical', position: guide.pos, source: 'image' })
            }
          } else if (Math.abs(currentEdges.right - guide.pos) < sensitivity) {
            if (!guides.some((g) => g.type === 'vertical' && Math.abs(g.position - guide.pos) < 0.1)) {
              snappedX += guide.pos - currentEdges.right
              guides.push({ type: 'vertical', position: guide.pos, source: 'image' })
            }
          } else if (Math.abs(currentEdges.centerX - guide.pos) < sensitivity) {
            if (!guides.some((g) => g.type === 'vertical' && Math.abs(g.position - guide.pos) < 0.1)) {
              snappedX += guide.pos - currentEdges.centerX
              guides.push({ type: 'vertical', position: guide.pos, source: 'image' })
            }
          }
        } else {
          if (Math.abs(currentEdges.top - guide.pos) < sensitivity) {
            if (!guides.some((g) => g.type === 'horizontal' && Math.abs(g.position - guide.pos) < 0.1)) {
              snappedY += guide.pos - currentEdges.top
              guides.push({ type: 'horizontal', position: guide.pos, source: 'image' })
            }
          } else if (Math.abs(currentEdges.bottom - guide.pos) < sensitivity) {
            if (!guides.some((g) => g.type === 'horizontal' && Math.abs(g.position - guide.pos) < 0.1)) {
              snappedY += guide.pos - currentEdges.bottom
              guides.push({ type: 'horizontal', position: guide.pos, source: 'image' })
            }
          } else if (Math.abs(currentEdges.centerY - guide.pos) < sensitivity) {
            if (!guides.some((g) => g.type === 'horizontal' && Math.abs(g.position - guide.pos) < 0.1)) {
              snappedY += guide.pos - currentEdges.centerY
              guides.push({ type: 'horizontal', position: guide.pos, source: 'image' })
            }
          }
        }
      }
    }

    return { x: snappedX, y: snappedY, guides }
  }

  const handleMouseDown = (e: MouseEvent | TouchEvent, imageId: string, handleType?: HandleType) => {
    e.preventDefault()
    e.stopPropagation()

    const { x, y } = getEventCoords(e)
    const canvasCoords = getCanvasCoords(x, y)

    const img = images.value.find((i) => i.id === imageId)
    if (!img) return

    const isMultiSelect = 'shiftKey' in e && e.shiftKey

    if (handleType === 'move' && !selectedImageIds.value.includes(imageId) && !isMultiSelect) {
      store.selectImage(imageId, isMultiSelect)
    } else if (handleType === 'move' && isMultiSelect) {
      store.selectImage(imageId, true)
    }

    activeImageIds.value = [...selectedImageIds.value]

    isDragging.value = true
    activeHandle.value = handleType || 'move'
    dragStartPos.value = {
      x: canvasCoords.x,
      y: canvasCoords.y,
      imageX: img.x,
      imageY: img.y,
      imageWidth: img.width,
      imageHeight: img.height,
      imageRotation: img.rotation,
      imageCenterX: img.x + img.width / 2,
      imageCenterY: img.y + img.height / 2,
    }

    store.setDragging(true)

    window.addEventListener('mousemove', handleMouseMove as EventListener)
    window.addEventListener('mouseup', handleMouseUp as EventListener)
    window.addEventListener('touchmove', handleMouseMove as EventListener, { passive: false })
    window.addEventListener('touchend', handleMouseUp as EventListener)
  }

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value || !dragStartPos.value || !activeHandle.value) return

    e.preventDefault()

    const { x, y } = getEventCoords(e)
    const canvasCoords = getCanvasCoords(x, y)

    const dx = canvasCoords.x - dragStartPos.value.x
    const dy = canvasCoords.y - dragStartPos.value.y

    const isShiftPressed = 'shiftKey' in e && e.shiftKey

    if (activeHandle.value === 'move') {
      handleMove(dx, dy, isShiftPressed)
    } else if (activeHandle.value === 'rotate') {
      handleRotate(canvasCoords.x, canvasCoords.y, isShiftPressed)
    } else {
      handleResize(dx, dy, isShiftPressed)
    }
  }

  const handleMove = (dx: number, dy: number, _shiftPressed: boolean) => {
    if (!dragStartPos.value) return

    let newX = dragStartPos.value.imageX + dx
    let newY = dragStartPos.value.imageY + dy

    if (smartLayout.value.snapToGrid) {
      newX = snapToGrid(newX, smartLayout.value.gridSize)
      newY = snapToGrid(newY, smartLayout.value.gridSize)
    }

    let allGuides: GuideLine[] = []

    for (const imageId of activeImageIds.value) {
      const img = images.value.find((i) => i.id === imageId)
      if (!img) continue

      const imgDx = img.x - dragStartPos.value.imageX
      const imgDy = img.y - dragStartPos.value.imageY

      let imgNewX = newX + imgDx
      let imgNewY = newY + imgDy

      if (smartLayout.value.snapToGuides && smartLayout.value.showGuides) {
        const result = detectGuides(img, imgNewX, imgNewY, img.width, img.height)
        imgNewX = result.x
        imgNewY = result.y
        allGuides = [...allGuides, ...result.guides]
      }

      store.updateImagePosition(imageId, imgNewX, imgNewY)
    }

    if (smartLayout.value.showGuides) {
      const uniqueGuides = allGuides.filter(
        (guide, index, self) =>
          index === self.findIndex((g) => g.type === guide.type && Math.abs(g.position - guide.position) < 0.1),
      )
      store.setActiveGuides(uniqueGuides)
    }
  }

  const handleResize = (dx: number, dy: number, shiftPressed: boolean) => {
    if (!dragStartPos.value || activeImageIds.value.length === 0) return

    const imageId = activeImageIds.value[0]
    const img = images.value.find((i) => i.id === imageId)
    if (!img) return

    const aspectRatio = dragStartPos.value.imageWidth / dragStartPos.value.imageHeight

    let newWidth = dragStartPos.value.imageWidth
    let newHeight = dragStartPos.value.imageHeight
    let newX = dragStartPos.value.imageX
    let newY = dragStartPos.value.imageY

    const handle = activeHandle.value

    switch (handle) {
      case 'nw':
        newWidth = dragStartPos.value.imageWidth - dx
        newHeight = dragStartPos.value.imageHeight - dy
        newX = dragStartPos.value.imageX + dx
        newY = dragStartPos.value.imageY + dy
        break
      case 'n':
        newHeight = dragStartPos.value.imageHeight - dy
        newY = dragStartPos.value.imageY + dy
        break
      case 'ne':
        newWidth = dragStartPos.value.imageWidth + dx
        newHeight = dragStartPos.value.imageHeight - dy
        newY = dragStartPos.value.imageY + dy
        break
      case 'e':
        newWidth = dragStartPos.value.imageWidth + dx
        break
      case 'se':
        newWidth = dragStartPos.value.imageWidth + dx
        newHeight = dragStartPos.value.imageHeight + dy
        break
      case 's':
        newHeight = dragStartPos.value.imageHeight + dy
        break
      case 'sw':
        newWidth = dragStartPos.value.imageWidth - dx
        newHeight = dragStartPos.value.imageHeight + dy
        newX = dragStartPos.value.imageX + dx
        break
      case 'w':
        newWidth = dragStartPos.value.imageWidth - dx
        newX = dragStartPos.value.imageX + dx
        break
    }

    if (shiftPressed) {
      if (Math.abs(dx) > Math.abs(dy)) {
        newHeight = newWidth / aspectRatio
      } else {
        newWidth = newHeight * aspectRatio
      }

      if (handle === 'nw' || handle === 'n' || handle === 'ne') {
        newY = dragStartPos.value.imageY + (dragStartPos.value.imageHeight - newHeight)
      }
      if (handle === 'nw' || handle === 'w' || handle === 'sw') {
        newX = dragStartPos.value.imageX + (dragStartPos.value.imageWidth - newWidth)
      }
    }

    newWidth = Math.max(10, newWidth)
    newHeight = Math.max(10, newHeight)

    if (smartLayout.value.snapToGrid) {
      newWidth = snapToGrid(newWidth, smartLayout.value.gridSize)
      newHeight = snapToGrid(newHeight, smartLayout.value.gridSize)
      newX = snapToGrid(newX, smartLayout.value.gridSize)
      newY = snapToGrid(newY, smartLayout.value.gridSize)
    }

    if (smartLayout.value.snapToGuides && smartLayout.value.showGuides) {
      const result = detectGuides(img, newX, newY, newWidth, newHeight)
      newX = result.x
      newY = result.y
      store.setActiveGuides(result.guides)
    }

    store.updateImagePosition(imageId, newX, newY)
    store.updateImageSize(imageId, newWidth, newHeight)
  }

  const handleRotate = (x: number, y: number, shiftPressed: boolean) => {
    if (!dragStartPos.value || activeImageIds.value.length === 0) return

    const imageId = activeImageIds.value[0]

    const centerX = dragStartPos.value.imageCenterX
    const centerY = dragStartPos.value.imageCenterY

    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI)
    let rotation = angle - 90

    if (shiftPressed) {
      rotation = Math.round(rotation / 15) * 15
    }

    rotation = ((rotation % 360) + 360) % 360

    store.updateImageRotation(imageId, rotation)
  }

  const handleMouseUp = () => {
    isDragging.value = false
    activeHandle.value = null
    dragStartPos.value = null
    activeImageIds.value = []
    isSelecting.value = false
    selectionBox.value = null

    store.setDragging(false)
    store.clearActiveGuides()

    window.removeEventListener('mousemove', handleMouseMove as EventListener)
    window.removeEventListener('mouseup', handleMouseUp as EventListener)
    window.removeEventListener('touchmove', handleMouseMove as EventListener)
    window.removeEventListener('touchend', handleMouseUp as EventListener)
  }

  const handleDoubleClick = (e: MouseEvent | TouchEvent, imageId: string) => {
    e.preventDefault()
    e.stopPropagation()
    store.startCropping(imageId)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedImageIds.value.length === 0) return

    const step = e.shiftKey ? 5 : 1

    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        ;[...selectedImageIds.value].forEach((id) => store.removeImage(id))
        break
      case 'ArrowLeft':
        e.preventDefault()
        selectedImageIds.value.forEach((id) => {
          const img = images.value.find((i) => i.id === id)
          if (img) {
            store.updateImagePosition(id, img.x - step, img.y)
          }
        })
        break
      case 'ArrowRight':
        e.preventDefault()
        selectedImageIds.value.forEach((id) => {
          const img = images.value.find((i) => i.id === id)
          if (img) {
            store.updateImagePosition(id, img.x + step, img.y)
          }
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        selectedImageIds.value.forEach((id) => {
          const img = images.value.find((i) => i.id === id)
          if (img) {
            store.updateImagePosition(id, img.x, img.y - step)
          }
        })
        break
      case 'ArrowDown':
        e.preventDefault()
        selectedImageIds.value.forEach((id) => {
          const img = images.value.find((i) => i.id === id)
          if (img) {
            store.updateImagePosition(id, img.x, img.y + step)
          }
        })
        break
    }
  }

  const handleCanvasMouseDown = (e: MouseEvent | TouchEvent) => {
    e.preventDefault()

    const { x, y } = getEventCoords(e)
    const canvasCoords = getCanvasCoords(x, y)

    const target = e.target as HTMLElement
    if (target.closest('.print-image')) return

    if ('shiftKey' in e && e.shiftKey) {
      isSelecting.value = true
      selectionBox.value = {
        startX: canvasCoords.x,
        startY: canvasCoords.y,
        endX: canvasCoords.x,
        endY: canvasCoords.y,
      }

      window.addEventListener('mousemove', handleSelectionMove as EventListener)
      window.addEventListener('mouseup', handleSelectionEnd as EventListener)
      window.addEventListener('touchmove', handleSelectionMove as EventListener, { passive: false })
      window.addEventListener('touchend', handleSelectionEnd as EventListener)
    } else {
      store.clearSelection()
    }
  }

  const handleSelectionMove = (e: MouseEvent | TouchEvent) => {
    if (!isSelecting.value || !selectionBox.value) return

    e.preventDefault()

    const { x, y } = getEventCoords(e)
    const canvasCoords = getCanvasCoords(x, y)

    selectionBox.value.endX = canvasCoords.x
    selectionBox.value.endY = canvasCoords.y

    const minX = Math.min(selectionBox.value.startX, selectionBox.value.endX)
    const maxX = Math.max(selectionBox.value.startX, selectionBox.value.endX)
    const minY = Math.min(selectionBox.value.startY, selectionBox.value.endY)
    const maxY = Math.max(selectionBox.value.startY, selectionBox.value.endY)

    const ids: string[] = []
    for (const img of images.value) {
      const edges = getImageEdges(img)
      if (
        edges.left >= minX &&
        edges.right <= maxX &&
        edges.top >= minY &&
        edges.bottom <= maxY
      ) {
        ids.push(img.id)
      }
    }

    selectedImageIds.value = ids
  }

  const handleSelectionEnd = () => {
    isSelecting.value = false
    selectionBox.value = null

    window.removeEventListener('mousemove', handleSelectionMove as EventListener)
    window.removeEventListener('mouseup', handleSelectionEnd as EventListener)
    window.removeEventListener('touchmove', handleSelectionMove as EventListener)
    window.removeEventListener('touchend', handleSelectionEnd as EventListener)
  }

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleKeyDown,
    handleCanvasMouseDown,
    isDragging,
    activeHandle,
    dragStartPos,
    activeGuides,
    selectionBox,
    isSelecting,
  }
}
