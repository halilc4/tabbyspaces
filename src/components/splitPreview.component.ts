import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core'
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
export class SplitPreviewComponent implements OnChanges {
  @Input() split!: WorkspaceSplit
  @Input() depth = 0
  @Input() selectedPaneId: string | null = null
  @Input() profiles: TabbyProfile[] = []
  @Output() paneEdit = new EventEmitter<WorkspacePane>()
  @Output() splitHorizontal = new EventEmitter<WorkspacePane>()
  @Output() splitVertical = new EventEmitter<WorkspacePane>()
  @Output() removePane = new EventEmitter<WorkspacePane>()
  @Output() addLeft = new EventEmitter<WorkspacePane>()
  @Output() addRight = new EventEmitter<WorkspacePane>()
  @Output() addTop = new EventEmitter<WorkspacePane>()
  @Output() addBottom = new EventEmitter<WorkspacePane>()

  contextMenuPane: WorkspacePane | null = null
  contextMenuPosition = { x: 0, y: 0 }

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Clear context menu when split input changes to avoid stale state
    if (changes['split']) {
      this.closeContextMenu()
    }
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
    this.paneEdit.emit(pane)
  }

  truncate(text: string, maxLength: number): string {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text
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

  getPaneLabel(pane: WorkspacePane): string {
    if (!pane.profileId) return 'Select profile'

    const profile = this.profiles.find(p => p.id === pane.profileId)
    return profile?.name || 'Select profile'
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
}
