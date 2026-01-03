import { Component, Input, Output, EventEmitter } from '@angular/core'
import {
  WorkspaceSplit,
  WorkspacePane,
  isWorkspaceSplit,
} from '../models/workspace.model'
import { WorkspaceEditorService } from '../services/workspaceEditor.service'

@Component({
  selector: 'split-preview',
  template: require('./splitPreview.component.pug'),
  styles: [require('./splitPreview.component.scss')],
})
export class SplitPreviewComponent {
  @Input() split!: WorkspaceSplit
  @Input() depth = 0
  @Output() paneClick = new EventEmitter<WorkspacePane>()
  @Output() splitHorizontal = new EventEmitter<WorkspacePane>()
  @Output() splitVertical = new EventEmitter<WorkspacePane>()
  @Output() removePane = new EventEmitter<WorkspacePane>()

  contextMenuPane: WorkspacePane | null = null
  contextMenuPosition = { x: 0, y: 0 }

  constructor(private workspaceService: WorkspaceEditorService) {}

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
    this.paneClick.emit(pane)
  }

  onContextMenu(event: MouseEvent, pane: WorkspacePane): void {
    event.preventDefault()
    this.contextMenuPane = pane
    this.contextMenuPosition = { x: event.clientX, y: event.clientY }
  }

  closeContextMenu(): void {
    this.contextMenuPane = null
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

  onRemove(): void {
    if (this.contextMenuPane) {
      this.removePane.emit(this.contextMenuPane)
      this.closeContextMenu()
    }
  }

  getProfileName(profileId: string): string {
    return this.workspaceService.getProfileName(profileId) ?? 'Select profile'
  }

  getPaneLabel(pane: WorkspacePane): string {
    if (pane.title) return pane.title
    if (pane.startupCommand) {
      const cmd = pane.startupCommand
      return cmd.length > 20 ? cmd.substring(0, 17) + '...' : cmd
    }
    return this.getProfileName(pane.profileId)
  }

  // Pass-through events from nested splits
  onNestedPaneClick(pane: WorkspacePane): void {
    this.paneClick.emit(pane)
  }

  onNestedSplitH(pane: WorkspacePane): void {
    this.splitHorizontal.emit(pane)
  }

  onNestedSplitV(pane: WorkspacePane): void {
    this.splitVertical.emit(pane)
  }

  onNestedRemove(pane: WorkspacePane): void {
    this.removePane.emit(pane)
  }
}
