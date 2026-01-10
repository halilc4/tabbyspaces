import { Component, Input, Output, EventEmitter, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostListener, ElementRef, ViewChild } from '@angular/core'
import {
  Workspace,
  WorkspacePane,
  WorkspaceSplit,
  TabbyProfile,
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
export class WorkspaceEditorComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() workspace!: Workspace
  @Input() autoFocus = false
  @Input() isRunning = false
  @Output() save = new EventEmitter<Workspace>()
  @Output() cancel = new EventEmitter<void>()
  @Output() run = new EventEmitter<Workspace>()

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>

  selectedPaneId: string | null = null
  editingPane: WorkspacePane | null = null
  showPaneEditor = false
  profiles: TabbyProfile[] = []
  availableIcons = [
    'columns', 'terminal', 'code', 'folder', 'home', 'briefcase',
    'cog', 'database', 'server', 'cloud', 'rocket', 'flask',
    'bug', 'wrench', 'cube', 'layer-group', 'sitemap', 'project-diagram'
  ]
  iconDropdownOpen = false

  constructor(
    private workspaceService: WorkspaceEditorService,
    private elementRef: ElementRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const iconPicker = this.elementRef.nativeElement.querySelector('.icon-picker')
    if (iconPicker && !iconPicker.contains(event.target as Node)) {
      this.iconDropdownOpen = false
    }
  }

  toggleIconDropdown(): void {
    this.iconDropdownOpen = !this.iconDropdownOpen
  }

  selectIcon(icon: string): void {
    this.workspace.icon = icon
    this.iconDropdownOpen = false
  }

  async ngOnInit(): Promise<void> {
    this.profiles = await this.workspaceService.getAvailableProfiles()
    this.initializeWorkspace()
  }

  ngAfterViewInit(): void {
    if (this.autoFocus && this.nameInput) {
      setTimeout(() => {
        this.nameInput.nativeElement.focus()
        this.nameInput.nativeElement.select()
      }, 0)
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workspace'] && !changes['workspace'].firstChange) {
      // Reset component state when workspace input changes
      this.selectedPaneId = null
      this.editingPane = null
      this.showPaneEditor = false
      this.iconDropdownOpen = false
      this.initializeWorkspace()
    }
  }

  private initializeWorkspace(): void {
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

  onRun(): void {
    if (!this.workspace.name?.trim()) {
      return
    }
    this.run.emit(this.workspace)
  }

  selectPane(pane: WorkspacePane): void {
    this.selectedPaneId = pane.id
  }

  deselectPane(): void {
    this.selectedPaneId = null
  }

  onPreviewBackgroundClick(): void {
    this.deselectPane()
  }

  editPane(pane: WorkspacePane): void {
    this.editingPane = pane
    this.showPaneEditor = true
  }

  editSelectedPane(): void {
    if (!this.selectedPaneId) return
    const pane = this.findPaneById(this.selectedPaneId)
    if (pane) this.editPane(pane)
  }

  closePaneEditor(): void {
    this.showPaneEditor = false
    this.editingPane = null
  }

  onPaneSave(pane: WorkspacePane): void {
    this.updatePaneInTree(this.workspace.root, pane)
    this.closePaneEditor()
  }

  // Helper functions
  private findPaneById(id: string): WorkspacePane | null {
    return this.findPaneInNode(this.workspace.root, id)
  }

  private findPaneInNode(node: WorkspaceSplit, id: string): WorkspacePane | null {
    for (const child of node.children) {
      if (isWorkspaceSplit(child)) {
        const found = this.findPaneInNode(child, id)
        if (found) return found
      } else if (child.id === id) {
        return child
      }
    }
    return null
  }

  canRemovePane(): boolean {
    return this.countPanes(this.workspace.root) > 1
  }

  private countPanes(node: WorkspaceSplit): number {
    return node.children.reduce((count, child) => {
      return count + (isWorkspaceSplit(child) ? this.countPanes(child) : 1)
    }, 0)
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

  splitSelectedPane(orientation: 'horizontal' | 'vertical'): void {
    if (!this.selectedPaneId) return
    const pane = this.findPaneById(this.selectedPaneId)
    if (pane) this.splitPane(pane, orientation)
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
        const newPane = createDefaultPane()
        newPane.profileId = child.profileId // Copy profile from source pane
        const newSplit: WorkspaceSplit = {
          orientation,
          ratios: [0.5, 0.5],
          children: [child, newPane],
        }
        node.children[i] = newSplit
        this.recalculateRatios(node)
        return true
      }
    }
    return false
  }

  removePane(pane: WorkspacePane): void {
    if (this.selectedPaneId === pane.id) {
      this.selectedPaneId = null
    }
    this.removePaneFromTree(this.workspace.root, pane)
  }

  removeSelectedPane(): void {
    if (!this.selectedPaneId || !this.canRemovePane()) return
    const pane = this.findPaneById(this.selectedPaneId)
    if (pane) this.removePane(pane)
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

  // Add pane operations
  addPane(direction: 'left' | 'right' | 'top' | 'bottom'): void {
    if (!this.selectedPaneId) return
    const pane = this.findPaneById(this.selectedPaneId)
    if (!pane) return
    this.addPaneInTree(this.workspace.root, pane, direction, null)
  }

  addPaneFromEvent(pane: WorkspacePane, direction: 'left' | 'right' | 'top' | 'bottom'): void {
    this.addPaneInTree(this.workspace.root, pane, direction, null)
  }

  private addPaneInTree(
    node: WorkspaceSplit,
    targetPane: WorkspacePane,
    direction: 'left' | 'right' | 'top' | 'bottom',
    parentNode: WorkspaceSplit | null
  ): boolean {
    const isHorizontalAdd = direction === 'left' || direction === 'right'
    const isBefore = direction === 'left' || direction === 'top'
    const targetOrientation = isHorizontalAdd ? 'horizontal' : 'vertical'

    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]

      if (isWorkspaceSplit(child)) {
        if (this.addPaneInTree(child, targetPane, direction, node)) return true
      } else if (child.id === targetPane.id) {
        const newPane = createDefaultPane()
        newPane.profileId = child.profileId

        if (node.orientation === targetOrientation) {
          // Same orientation: add as sibling
          const insertIndex = isBefore ? i : i + 1
          node.children.splice(insertIndex, 0, newPane)
          this.recalculateRatios(node)
        } else {
          // Different orientation: wrap entire node in new split
          const nodeCopy: WorkspaceSplit = {
            orientation: node.orientation,
            ratios: [...node.ratios],
            children: [...node.children]
          }
          const wrapper: WorkspaceSplit = {
            orientation: targetOrientation,
            ratios: [0.5, 0.5],
            children: isBefore ? [newPane, nodeCopy] : [nodeCopy, newPane]
          }

          if (node === this.workspace.root) {
            this.workspace.root = wrapper
          } else if (parentNode) {
            const nodeIndex = parentNode.children.indexOf(node)
            if (nodeIndex !== -1) {
              parentNode.children[nodeIndex] = wrapper
            }
          }
        }
        return true
      }
    }
    return false
  }

}
