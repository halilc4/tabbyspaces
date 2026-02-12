import { Component, Input, Output, EventEmitter, OnInit, OnChanges, AfterViewInit, SimpleChanges, HostListener, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core'
import {
  Workspace,
  WorkspacePane,
  WorkspaceSplit,
  WorkspaceBackground,
  TabbyProfile,
  isWorkspaceSplit,
  createDefaultPane,
  generateUUID,
  BACKGROUND_PRESETS,
} from '../models/workspace.model'

interface TreeContext {
  node: WorkspaceSplit
  index: number
  parent: WorkspaceSplit | null
  child: WorkspacePane | WorkspaceSplit
}
import { WorkspaceEditorService } from '../services/workspaceEditor.service'

@Component({
  selector: 'workspace-editor',
  template: require('./workspaceEditor.component.pug'),
  styles: [require('./workspaceEditor.component.scss')],
})
export class WorkspaceEditorComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() workspace!: Workspace
  @Input() autoFocus = false
  @Input() hasUnsavedChanges = false
  @Output() save = new EventEmitter<Workspace>()
  @Output() cancel = new EventEmitter<void>()

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>

  selectedPaneId: string | null = null
  wasResizing = false
  editingPane: WorkspacePane | null = null
  showPaneEditor = false
  profiles: TabbyProfile[] = []
  availableIcons = [
    'columns', 'terminal', 'code', 'folder', 'home', 'briefcase',
    'cog', 'database', 'server', 'cloud', 'rocket', 'flask',
    'bug', 'wrench', 'cube', 'layer-group', 'sitemap', 'project-diagram'
  ]
  iconDropdownOpen = false
  backgroundPresets = BACKGROUND_PRESETS
  backgroundDropdownOpen = false
  customBackgroundValue = ''

  constructor(
    private workspaceService: WorkspaceEditorService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Check if click is outside the icon dropdown area (trigger + dropdown)
    const dropdownTrigger = this.elementRef.nativeElement.querySelector('.dropdown-trigger')
    const iconDropdown = this.elementRef.nativeElement.querySelector('.icon-dropdown')
    const iconClickedInside = dropdownTrigger?.contains(event.target as Node) ||
                          iconDropdown?.contains(event.target as Node)
    if (this.iconDropdownOpen && !iconClickedInside) {
      this.iconDropdownOpen = false
    }

    // Check if click is outside the background dropdown area
    const bgTrigger = this.elementRef.nativeElement.querySelector('.background-trigger')
    const bgDropdown = this.elementRef.nativeElement.querySelector('.background-dropdown')
    const bgClickedInside = bgTrigger?.contains(event.target as Node) ||
                            bgDropdown?.contains(event.target as Node)
    if (this.backgroundDropdownOpen && !bgClickedInside) {
      this.backgroundDropdownOpen = false
    }
  }

  toggleIconDropdown(): void {
    this.iconDropdownOpen = !this.iconDropdownOpen
  }

  selectIcon(icon: string): void {
    this.workspace.icon = icon
    this.iconDropdownOpen = false
  }

  toggleBackgroundDropdown(): void {
    this.backgroundDropdownOpen = !this.backgroundDropdownOpen
  }

  selectBackgroundPreset(preset: WorkspaceBackground): void {
    if (preset.type === 'none') {
      this.workspace.background = undefined
      this.customBackgroundValue = ''
    } else {
      this.workspace.background = { ...preset }
      this.customBackgroundValue = preset.value
    }
    this.backgroundDropdownOpen = false
  }

  applyCustomBackground(): void {
    const value = this.customBackgroundValue.trim()
    if (value) {
      this.workspace.background = {
        type: 'gradient',
        value
      }
    } else {
      this.workspace.background = undefined
    }
  }

  clearBackground(): void {
    this.workspace.background = undefined
    this.customBackgroundValue = ''
  }

  isBackgroundSelected(preset: WorkspaceBackground): boolean {
    if (preset.type === 'none') {
      return !this.workspace.background || this.workspace.background.type === 'none'
    }
    return this.workspace.background?.value === preset.value
  }

  async ngOnInit(): Promise<void> {
    this.profiles = await this.workspaceService.getAvailableProfiles()
    this.initializeWorkspace()
    this.cdr.detectChanges()
  }

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      this.focusNameInput()
    }
  }

  private focusNameInput(): void {
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (this.nameInput?.nativeElement) {
          this.nameInput.nativeElement.focus()
          this.nameInput.nativeElement.select()
        }
      }, 0)
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workspace'] && !changes['workspace'].firstChange) {
      const prevId = changes['workspace'].previousValue?.id
      const currId = this.workspace.id

      if (prevId !== currId) {
        // Different workspace - reset everything and focus name input
        this.selectedPaneId = null
        this.editingPane = null
        this.showPaneEditor = false
        this.focusNameInput()
      } else {
        // Same workspace ID but different reference (after save/reload)
        // Re-sync editingPane to point to pane in new object tree
        if (this.selectedPaneId && this.showPaneEditor) {
          this.editingPane = this.findPaneById(this.selectedPaneId)
        }
      }
      // Always reset dropdowns and sync background value
      this.iconDropdownOpen = false
      this.backgroundDropdownOpen = false
      this.customBackgroundValue = this.workspace.background?.value || ''
      this.initializeWorkspace()
    }

    // Handle autoFocus change
    if (changes['autoFocus']?.currentValue) {
      this.focusNameInput()
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

  deselectPane(): void {
    this.selectedPaneId = null
  }

  onPreviewBackgroundClick(): void {
    if (this.wasResizing) return
    this.deselectPane()
    this.closePaneEditor()
  }

  onResizeEnd(): void {
    this.wasResizing = true
    setTimeout(() => { this.wasResizing = false }, 0)
  }

  editPane(pane: WorkspacePane): void {
    if (this.wasResizing) return
    if (this.selectedPaneId === pane.id) {
      this.selectedPaneId = null
      this.closePaneEditor()
      return
    }
    this.selectedPaneId = pane.id
    this.editingPane = pane
    this.showPaneEditor = true
    this.cdr.detectChanges()
  }

  closePaneEditor(): void {
    this.showPaneEditor = false
    this.editingPane = null
    this.cdr.detectChanges()
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

  private walkTree(
    node: WorkspaceSplit,
    visitor: (ctx: TreeContext) => boolean,
    parent: WorkspaceSplit | null = null
  ): boolean {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      const ctx: TreeContext = { node, index: i, parent, child }

      if (isWorkspaceSplit(child)) {
        if (this.walkTree(child, visitor, node)) return true
      } else if (visitor(ctx)) {
        return true
      }
    }
    return false
  }

  private updatePaneInTree(updatedPane: WorkspacePane): boolean {
    return this.walkTree(this.workspace.root, (ctx) => {
      if ((ctx.child as WorkspacePane).id === updatedPane.id) {
        ctx.node.children[ctx.index] = updatedPane
        return true
      }
      return false
    })
  }

  splitPane(pane: WorkspacePane, orientation: 'horizontal' | 'vertical'): void {
    this.splitPaneInTree(pane, orientation)
    this.cdr.detectChanges()
  }

  splitSelectedPane(orientation: 'horizontal' | 'vertical'): void {
    if (!this.selectedPaneId) return
    const pane = this.findPaneById(this.selectedPaneId)
    if (pane) this.splitPane(pane, orientation)
  }

  private splitPaneInTree(
    targetPane: WorkspacePane,
    orientation: 'horizontal' | 'vertical'
  ): boolean {
    return this.walkTree(this.workspace.root, (ctx) => {
      if ((ctx.child as WorkspacePane).id === targetPane.id) {
        const newPane = createDefaultPane()
        newPane.profileId = (ctx.child as WorkspacePane).profileId
        const newSplit: WorkspaceSplit = {
          orientation,
          ratios: [0.5, 0.5],
          children: [ctx.child, newPane],
        }
        ctx.node.children[ctx.index] = newSplit
        return true
      }
      return false
    })
  }

  removePane(pane: WorkspacePane): void {
    if (this.selectedPaneId === pane.id) {
      this.selectedPaneId = null
    }
    this.removePaneFromTree(this.workspace.root, pane)
    this.cdr.detectChanges()
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
    this.cdr.detectChanges()
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
    this.cdr.detectChanges()
  }

  onRatioChange(): void {
    this.cdr.detectChanges()
  }

  // Add pane operations
  addPane(direction: 'left' | 'right' | 'top' | 'bottom'): void {
    if (!this.selectedPaneId) return
    const pane = this.findPaneById(this.selectedPaneId)
    if (!pane) return
    this.addPaneInTree(pane, direction)
    this.cdr.detectChanges()
  }

  addPaneFromEvent(pane: WorkspacePane, direction: 'left' | 'right' | 'top' | 'bottom'): void {
    this.addPaneInTree(pane, direction)
    this.cdr.detectChanges()
  }

  private addPaneInTree(
    targetPane: WorkspacePane,
    direction: 'left' | 'right' | 'top' | 'bottom'
  ): boolean {
    const isHorizontalAdd = direction === 'left' || direction === 'right'
    const isBefore = direction === 'left' || direction === 'top'
    const targetOrientation = isHorizontalAdd ? 'horizontal' : 'vertical'

    return this.walkTree(this.workspace.root, (ctx) => {
      if ((ctx.child as WorkspacePane).id !== targetPane.id) return false

      const newPane = createDefaultPane()
      newPane.profileId = (ctx.child as WorkspacePane).profileId

      if (ctx.node.orientation === targetOrientation) {
        // Same orientation: split the target pane's ratio in half
        const insertIndex = isBefore ? ctx.index : ctx.index + 1
        const originalRatio = ctx.node.ratios[ctx.index]
        const halfRatio = originalRatio / 2
        ctx.node.children.splice(insertIndex, 0, newPane)
        ctx.node.ratios.splice(ctx.index, 1, halfRatio, halfRatio)
      } else {
        // Different orientation: wrap entire node in new split
        const nodeCopy: WorkspaceSplit = {
          orientation: ctx.node.orientation,
          ratios: [...ctx.node.ratios],
          children: [...ctx.node.children]
        }
        const wrapper: WorkspaceSplit = {
          orientation: targetOrientation,
          ratios: [0.5, 0.5],
          children: isBefore ? [newPane, nodeCopy] : [nodeCopy, newPane]
        }

        if (ctx.node === this.workspace.root) {
          this.workspace.root = wrapper
        } else if (ctx.parent) {
          const nodeIndex = ctx.parent.children.indexOf(ctx.node)
          if (nodeIndex !== -1) {
            ctx.parent.children[nodeIndex] = wrapper
          }
        }
      }
      return true
    })
  }

}
