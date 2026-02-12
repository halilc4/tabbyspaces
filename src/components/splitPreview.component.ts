import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, ChangeDetectorRef, ElementRef } from '@angular/core'
import {
  WorkspaceSplit,
  WorkspacePane,
  TabbyProfile,
  isWorkspaceSplit,
} from '../models/workspace.model'

@Component({
  selector: 'split-preview',
  template: require('./splitPreview.component.pug'),
  styles: [require('./splitPreview.component.scss')],
})
export class SplitPreviewComponent implements OnChanges, OnDestroy {
  @Input() split!: WorkspaceSplit
  @Input() depth = 0
  @Input() selectedPaneId: string | null = null
  @Input() profiles: TabbyProfile[] = []
  @Input() globalWidthRatio = 1
  @Input() globalHeightRatio = 1
  @Output() paneEdit = new EventEmitter<WorkspacePane>()
  @Output() splitHorizontal = new EventEmitter<WorkspacePane>()
  @Output() splitVertical = new EventEmitter<WorkspacePane>()
  @Output() removePane = new EventEmitter<WorkspacePane>()
  @Output() addLeft = new EventEmitter<WorkspacePane>()
  @Output() addRight = new EventEmitter<WorkspacePane>()
  @Output() addTop = new EventEmitter<WorkspacePane>()
  @Output() addBottom = new EventEmitter<WorkspacePane>()
  @Output() ratioChange = new EventEmitter<void>()
  @Output() resizeEnd = new EventEmitter<void>()

  contextMenuPane: WorkspacePane | null = null
  contextMenuPosition = { x: 0, y: 0 }

  // Drag state
  resizing = false
  wasResizing = false
  resizeIndex = -1
  private resizeContainerRect: DOMRect | null = null
  private boundOnResizeMove: ((e: MouseEvent) => void) | null = null
  private boundOnResizeEnd: (() => void) | null = null

  constructor(private cdr: ChangeDetectorRef, private elementRef: ElementRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Clear context menu when split input changes to avoid stale state
    if (changes['split']) {
      this.closeContextMenu()
    }
  }

  ngOnDestroy(): void {
    this.cleanupDragListeners()
  }

  isPane(child: WorkspacePane | WorkspaceSplit): boolean {
    return !isWorkspaceSplit(child)
  }

  isSplit(child: WorkspacePane | WorkspaceSplit): boolean {
    return isWorkspaceSplit(child)
  }

  asSplit(child: WorkspacePane | WorkspaceSplit): WorkspaceSplit {
    return child as WorkspaceSplit
  }

  asPane(child: WorkspacePane | WorkspaceSplit): WorkspacePane {
    return child as WorkspacePane
  }

  getFlexStyle(index: number): string {
    return `${this.split.ratios[index] * 100}%`
  }

  onPaneClick(pane: WorkspacePane): void {
    if (this.wasResizing) return
    this.paneEdit.emit(pane)
  }

  onContextMenu(event: MouseEvent, pane: WorkspacePane): void {
    event.preventDefault()
    this.contextMenuPane = pane
    this.contextMenuPosition = { x: event.clientX, y: event.clientY }
  }

  closeContextMenu(): void {
    this.contextMenuPane = null
    this.cdr.detectChanges()
  }

  onEdit(): void {
    if (this.contextMenuPane) {
      this.paneEdit.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  onSplitH(): void {
    if (this.contextMenuPane) {
      this.splitHorizontal.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  onSplitV(): void {
    if (this.contextMenuPane) {
      this.splitVertical.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  onAddLeft(): void {
    if (this.contextMenuPane) {
      this.addLeft.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  onAddRight(): void {
    if (this.contextMenuPane) {
      this.addRight.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  onAddTop(): void {
    if (this.contextMenuPane) {
      this.addTop.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  onAddBottom(): void {
    if (this.contextMenuPane) {
      this.addBottom.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  onRemove(): void {
    if (this.contextMenuPane) {
      this.removePane.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  getChildGlobalWidth(index: number): number {
    return this.split.orientation === 'horizontal'
      ? this.globalWidthRatio * this.split.ratios[index]
      : this.globalWidthRatio
  }

  getChildGlobalHeight(index: number): number {
    return this.split.orientation === 'vertical'
      ? this.globalHeightRatio * this.split.ratios[index]
      : this.globalHeightRatio
  }

  getPaneGlobalWidth(index: number): string {
    return Math.round(this.getChildGlobalWidth(index) * 100) + '%'
  }

  getPaneGlobalHeight(index: number): string {
    return Math.round(this.getChildGlobalHeight(index) * 100) + '%'
  }

  getPaneLabel(pane: WorkspacePane): string {
    if (!pane.profileId) return 'Select profile'

    const profile = this.profiles.find(p => p.id === pane.profileId)
    return profile?.name || 'Select profile'
  }

  // Resize handle drag logic
  onResizeStart(event: MouseEvent, handleIndex: number): void {
    event.preventDefault()
    event.stopPropagation()

    this.resizeIndex = handleIndex
    this.resizing = true

    const container = this.elementRef.nativeElement.querySelector('.split-preview')
    this.resizeContainerRect = container.getBoundingClientRect()

    this.boundOnResizeMove = this.onResizeMove.bind(this)
    this.boundOnResizeEnd = this.onResizeEnd.bind(this)
    document.addEventListener('mousemove', this.boundOnResizeMove)
    document.addEventListener('mouseup', this.boundOnResizeEnd)
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.resizing || !this.resizeContainerRect) return

    const k = this.resizeIndex
    const isHorizontal = this.split.orientation === 'horizontal'
    const containerStart = isHorizontal ? this.resizeContainerRect.left : this.resizeContainerRect.top
    const containerSize = isHorizontal ? this.resizeContainerRect.width : this.resizeContainerRect.height
    const mousePos = isHorizontal ? event.clientX : event.clientY

    // Calculate offset: sum of ratios before the left child
    let offset = 0
    for (let i = 0; i < k; i++) {
      offset += this.split.ratios[i]
    }

    const combined = this.split.ratios[k] + this.split.ratios[k + 1]
    const mouseRatio = (mousePos - containerStart) / containerSize

    // Snap to nearest 0.1
    let newLeft = Math.round((mouseRatio - offset) / 0.1) * 0.1

    // Clamp
    newLeft = Math.max(0.1, Math.min(combined - 0.1, newLeft))

    // Only update if changed
    if (Math.abs(this.split.ratios[k] - newLeft) > 0.001) {
      this.split.ratios[k] = newLeft
      this.split.ratios[k + 1] = combined - newLeft
      this.ratioChange.emit()
      this.cdr.detectChanges()
    }
  }

  private onResizeEnd(): void {
    this.resizing = false
    this.wasResizing = true
    setTimeout(() => { this.wasResizing = false }, 0)
    this.resizeIndex = -1
    this.resizeContainerRect = null
    this.cleanupDragListeners()
    this.resizeEnd.emit()
    this.cdr.detectChanges()
  }

  private cleanupDragListeners(): void {
    if (this.boundOnResizeMove) {
      document.removeEventListener('mousemove', this.boundOnResizeMove)
      this.boundOnResizeMove = null
    }
    if (this.boundOnResizeEnd) {
      document.removeEventListener('mouseup', this.boundOnResizeEnd)
      this.boundOnResizeEnd = null
    }
  }

  // Pass-through events from nested splits
  onNestedPaneEdit(pane: WorkspacePane): void {
    this.paneEdit.emit(pane)
  }

  onNestedSplitH(pane: WorkspacePane): void {
    this.splitHorizontal.emit(pane)
  }

  onNestedSplitV(pane: WorkspacePane): void {
    this.splitVertical.emit(pane)
  }

  onNestedAddLeft(pane: WorkspacePane): void {
    this.addLeft.emit(pane)
  }

  onNestedAddRight(pane: WorkspacePane): void {
    this.addRight.emit(pane)
  }

  onNestedAddTop(pane: WorkspacePane): void {
    this.addTop.emit(pane)
  }

  onNestedAddBottom(pane: WorkspacePane): void {
    this.addBottom.emit(pane)
  }

  onNestedRemove(pane: WorkspacePane): void {
    this.removePane.emit(pane)
  }

  onNestedRatioChange(): void {
    this.ratioChange.emit()
  }

  onNestedResizeEnd(): void {
    this.wasResizing = true
    setTimeout(() => { this.wasResizing = false }, 0)
    this.resizeEnd.emit()
  }
}
