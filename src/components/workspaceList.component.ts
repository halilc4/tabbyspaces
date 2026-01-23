import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ElementRef, NgZone } from '@angular/core'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { ConfigService, ProfilesService } from 'tabby-core'
import { Subscription } from 'rxjs'
import { StartupCommandService } from '../services/startupCommand.service'
import { WorkspaceEditorService } from '../services/workspaceEditor.service'
import { DeleteConfirmModalComponent } from './deleteConfirmModal.component'
import {
  Workspace,
  WorkspacePane,
  WorkspaceSplit,
  TabbyProfile,
  countPanes,
  createDefaultWorkspace,
  deepClone,
  isWorkspaceSplit,
} from '../models/workspace.model'

const SETTINGS_MAX_WIDTH = '876px'

@Component({
  selector: 'workspace-list',
  template: require('./workspaceList.component.pug'),
  styles: [require('./workspaceList.component.scss')],
})
export class WorkspaceListComponent implements OnInit, OnDestroy, AfterViewInit {
  workspaces: Workspace[] = []
  selectedWorkspace: Workspace | null = null
  editingWorkspace: Workspace | null = null
  isCreatingNew = false
  openingWorkspaceId: string | null = null
  displayTabs: Array<{ workspace: Workspace; isNew: boolean }> = []
  private cachedProfiles: TabbyProfile[] = []
  private configSubscription: Subscription | null = null

  constructor(
    public config: ConfigService,
    private workspaceService: WorkspaceEditorService,
    private profilesService: ProfilesService,
    private startupService: StartupCommandService,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef,
    private zone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    this.loadWorkspaces()
    this.autoSelectFirst()
    this.cachedProfiles = await this.workspaceService.getAvailableProfiles()
    this.configSubscription = this.config.changed$.subscribe(() => {
      this.zone.run(() => this.loadWorkspaces())
    })
  }

  ngAfterViewInit(): void {
    // Hack: Override Tabby's settings-tab-body max-width restriction
    setTimeout(() => {
      const parent = this.elementRef.nativeElement.closest('settings-tab-body') as HTMLElement
      if (parent) {
        parent.style.maxWidth = SETTINGS_MAX_WIDTH
      }
    }, 0)
  }

  private autoSelectFirst(): void {
    if (this.workspaces.length > 0 && !this.selectedWorkspace) {
      this.selectWorkspace(this.workspaces[0])
    }
  }

  selectWorkspace(workspace: Workspace): void {
    this.isCreatingNew = false
    this.selectedWorkspace = workspace
    this.editingWorkspace = deepClone(workspace)
    this.updateDisplayTabs()
  }

  isSelected(workspace: Workspace): boolean {
    return this.selectedWorkspace?.id === workspace.id
  }

  ngOnDestroy(): void {
    this.configSubscription?.unsubscribe()
  }

  loadWorkspaces(): void {
    const previousSelectedId = this.selectedWorkspace?.id
    this.workspaces = this.workspaceService.getWorkspaces()

    // Re-sync selectedWorkspace to point to object in new array
    // This prevents stale reference after delete/reload operations
    if (previousSelectedId) {
      this.selectedWorkspace = this.workspaces.find(w => w.id === previousSelectedId) || null
    }

    this.updateDisplayTabs()
  }

  createWorkspace(): void {
    console.log('[L5 DEBUG] createWorkspace called, cachedProfiles:', this.cachedProfiles.length)
    const defaultProfileId = this.cachedProfiles[0]?.id || ''
    const workspace = createDefaultWorkspace()
    this.setProfileForAllPanes(workspace.root, defaultProfileId)
    this.selectedWorkspace = null
    this.editingWorkspace = workspace
    this.isCreatingNew = true
    console.log('[L5 DEBUG] before updateDisplayTabs, isCreatingNew:', this.isCreatingNew, 'editingWorkspace:', !!this.editingWorkspace)
    this.updateDisplayTabs()
    console.log('[L5 DEBUG] after updateDisplayTabs, displayTabs.length:', this.displayTabs.length)
    this.cdr.detectChanges()
  }

  private setProfileForAllPanes(node: WorkspacePane | WorkspaceSplit, profileId: string): void {
    if (isWorkspaceSplit(node)) {
      node.children.forEach((child) => this.setProfileForAllPanes(child, profileId))
    } else {
      node.profileId = profileId
    }
  }

  editWorkspace(workspace: Workspace): void {
    this.selectWorkspace(workspace)
  }

  async duplicateWorkspace(event: MouseEvent, workspace: Workspace): Promise<void> {
    event.stopPropagation()
    const clone = this.workspaceService.duplicateWorkspace(workspace)
    await this.workspaceService.addWorkspace(clone)

    this.zone.run(() => {
      this.loadWorkspaces()
      const duplicated = this.workspaces.find((w) => w.id === clone.id)
      if (duplicated) {
        this.selectWorkspace(duplicated)
      }
    })
  }

  async deleteWorkspace(event: MouseEvent, workspace: Workspace): Promise<void> {
    event.stopPropagation()

    const confirmed = await this.confirmDelete(workspace.name)
    if (!confirmed) return

    const wasSelected = this.selectedWorkspace?.id === workspace.id
    const deletedIndex = this.workspaces.findIndex((w) => w.id === workspace.id)

    await this.workspaceService.deleteWorkspace(workspace.id)

    this.zone.run(() => {
      this.loadWorkspaces()
      if (this.workspaces.length === 0) {
        this.selectedWorkspace = null
        this.editingWorkspace = null
        this.isCreatingNew = false
      } else if (wasSelected) {
        const nextIndex = Math.min(deletedIndex, this.workspaces.length - 1)
        this.selectWorkspace(this.workspaces[nextIndex])
      }
    })
  }

  private async confirmDelete(name: string): Promise<boolean> {
    const modalRef = this.modalService.open(DeleteConfirmModalComponent)
    modalRef.componentInstance.workspaceName = name
    try {
      await modalRef.result
      return true
    } catch {
      return false
    }
  }

  async onEditorSave(workspace: Workspace): Promise<void> {
    const isNew = !this.workspaces.find((w) => w.id === workspace.id)
    if (isNew) {
      await this.workspaceService.addWorkspace(workspace)
    } else {
      await this.workspaceService.updateWorkspace(workspace)
    }

    // Wrap state changes in zone.run to ensure proper change detection
    this.zone.run(() => {
      this.loadWorkspaces()
      this.isCreatingNew = false
      const saved = this.workspaces.find((w) => w.id === workspace.id)
      if (saved) {
        this.selectWorkspace(saved)
      }
    })
  }

  onEditorCancel(): void {
    if (this.isCreatingNew) {
      // Cancel new workspace creation - go back to first workspace or empty
      this.isCreatingNew = false
      if (this.workspaces.length > 0) {
        this.selectWorkspace(this.workspaces[0])
      } else {
        this.selectedWorkspace = null
        this.editingWorkspace = null
        this.updateDisplayTabs()
      }
    } else if (this.selectedWorkspace) {
      // Reset to original workspace data
      this.editingWorkspace = deepClone(this.selectedWorkspace)
    }
    this.cdr.detectChanges()
  }

  getPaneCount(workspace: Workspace): number {
    return countPanes(workspace.root)
  }

  getOrientationLabel(workspace: Workspace): string {
    return workspace.root.orientation === 'horizontal' ? 'horizontal' : 'vertical'
  }

  get hasUnsavedChanges(): boolean {
    if (!this.editingWorkspace || !this.selectedWorkspace) return this.isCreatingNew
    return JSON.stringify(this.editingWorkspace) !== JSON.stringify(this.selectedWorkspace)
  }

  // Update display tabs array (call after state changes)
  private updateDisplayTabs(): void {
    const tabs = this.workspaces.map(w => ({ workspace: w, isNew: false }))
    if (this.isCreatingNew && this.editingWorkspace) {
      tabs.push({ workspace: this.editingWorkspace, isNew: true })
    }
    this.displayTabs = tabs
  }

  isTabSelected(tab: { workspace: Workspace; isNew: boolean }): boolean {
    if (tab.isNew) return true
    return this.selectedWorkspace?.id === tab.workspace.id
  }

  trackByTab(index: number, tab: { workspace: Workspace; isNew: boolean }): string {
    return tab.isNew ? '__new__' : tab.workspace.id
  }

  async openWorkspace(event: MouseEvent, workspace: Workspace): Promise<void> {
    event.stopPropagation()
    if (this.openingWorkspaceId) return
    this.openingWorkspaceId = workspace.id

    try {
      const commands = this.workspaceService.collectStartupCommands(workspace)
      if (commands.length > 0) {
        this.startupService.registerCommands(commands)
      }

      const profile = await this.workspaceService.generateTabbyProfile(workspace)
      this.zone.run(() => {
        this.profilesService.openNewTabForProfile(profile)
      })
    } finally {
      this.openingWorkspaceId = null
      this.cdr.detectChanges()
    }
  }

}
