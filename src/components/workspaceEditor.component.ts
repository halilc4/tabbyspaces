import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import {
  Workspace,
  WorkspacePane,
  WorkspaceSplit,
  isWorkspaceSplit,
  createDefaultPane,
  generateUUID,
} from '../models/workspace.model'
import { WorkspaceEditorService } from '../services/workspaceEditor.service'

@Component({
  selector: 'workspace-editor',
  template: require('./workspaceEditor.component.pug'),
  styles: [require('./workspaceEditor.component.scss')],
})
export class WorkspaceEditorComponent implements OnInit {
  @Input() workspace!: Workspace
  @Output() save = new EventEmitter<Workspace>()
  @Output() cancel = new EventEmitter<void>()

  selectedPane: WorkspacePane | null = null
  showPaneEditor = false
  availableIcons = [
    'columns', 'terminal', 'code', 'folder', 'home', 'briefcase',
    'cog', 'database', 'server', 'cloud', 'rocket', 'flask',
    'bug', 'wrench', 'cube', 'layer-group', 'sitemap', 'project-diagram'
  ]

  constructor(private workspaceService: WorkspaceEditorService) {}

  ngOnInit(): void {
    if (!this.workspace.root) {
      this.workspace.root = {
        orientation: 'horizontal',
        ratios: [0.5, 0.5],
        children: [createDefaultPane(), createDefaultPane()],
      }
    }
  }

  onSave(): void {
    if (!this.workspace.name?.trim()) {
      return
    }
    this.save.emit(this.workspace)
  }

  onCancel(): void {
    this.cancel.emit()
  }

  selectPane(pane: WorkspacePane): void {
    this.selectedPane = pane
    this.showPaneEditor = true
  }

  closePaneEditor(): void {
    this.showPaneEditor = false
    this.selectedPane = null
  }

  onPaneSave(pane: WorkspacePane): void {
    this.updatePaneInTree(this.workspace.root, pane)
    this.closePaneEditor()
  }

  private updatePaneInTree(node: WorkspaceSplit, updatedPane: WorkspacePane): boolean {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      if (isWorkspaceSplit(child)) {
        if (this.updatePaneInTree(child, updatedPane)) {
          return true
        }
      } else if (child.id === updatedPane.id) {
        node.children[i] = updatedPane
        return true
      }
    }
    return false
  }

  splitPane(pane: WorkspacePane, orientation: 'horizontal' | 'vertical'): void {
    this.splitPaneInTree(this.workspace.root, pane, orientation)
  }

  private splitPaneInTree(
    node: WorkspaceSplit,
    targetPane: WorkspacePane,
    orientation: 'horizontal' | 'vertical'
  ): boolean {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      if (isWorkspaceSplit(child)) {
        if (this.splitPaneInTree(child, targetPane, orientation)) {
          return true
        }
      } else if (child.id === targetPane.id) {
        const newSplit: WorkspaceSplit = {
          orientation,
          ratios: [0.5, 0.5],
          children: [child, createDefaultPane()],
        }
        node.children[i] = newSplit
        this.recalculateRatios(node)
        return true
      }
    }
    return false
  }

  removePane(pane: WorkspacePane): void {
    this.removePaneFromTree(this.workspace.root, pane)
  }

  private removePaneFromTree(node: WorkspaceSplit, targetPane: WorkspacePane): boolean {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      if (isWorkspaceSplit(child)) {
        // Check if the pane is directly in this split
        const paneIndex = child.children.findIndex(
          (c) => !isWorkspaceSplit(c) && (c as WorkspacePane).id === targetPane.id
        )
        if (paneIndex !== -1 && child.children.length > 1) {
          child.children.splice(paneIndex, 1)
          this.recalculateRatios(child)
          // If only one child remains, flatten
          if (child.children.length === 1) {
            node.children[i] = child.children[0]
          }
          return true
        }
        if (this.removePaneFromTree(child, targetPane)) {
          return true
        }
      } else if (child.id === targetPane.id) {
        if (node.children.length > 1) {
          node.children.splice(i, 1)
          this.recalculateRatios(node)
          return true
        }
      }
    }
    return false
  }

  private recalculateRatios(split: WorkspaceSplit): void {
    const count = split.children.length
    split.ratios = split.children.map(() => 1 / count)
  }

  setOrientation(orientation: 'horizontal' | 'vertical'): void {
    this.workspace.root.orientation = orientation
  }

  updateRatio(index: number, value: number): void {
    const ratios = [...this.workspace.root.ratios]
    const diff = value - ratios[index]

    if (index < ratios.length - 1) {
      ratios[index] = value
      ratios[index + 1] -= diff
    } else {
      ratios[index] = value
      ratios[index - 1] -= diff
    }

    // Clamp values
    ratios.forEach((r, i) => {
      ratios[i] = Math.max(0.1, Math.min(0.9, r))
    })

    this.workspace.root.ratios = ratios
  }

  getAvailableProfiles(): any[] {
    return this.workspaceService.getAvailableProfiles()
  }
}
