import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef, ElementRef } from '@angular/core'
import { ConfigService, ProfilesService } from 'tabby-core'
import { Subscription } from 'rxjs'
import { StartupCommandService } from '../services/startupCommand.service'
import { WorkspaceEditorService } from '../services/workspaceEditor.service'
import {
  Workspace,
  WorkspacePane,
  WorkspaceSplit,
  countPanes,
  createDefaultWorkspace,
  isWorkspaceSplit,
} from '../models/workspace.model'

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
  isRunning = false
  private configSubscription: Subscription | null = null

  constructor(
    public config: ConfigService,
    private workspaceService: WorkspaceEditorService,
    private profilesService: ProfilesService,
    private startupService: StartupCommandService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.loadWorkspaces()
    this.autoSelectFirst()
    this.configSubscription = this.config.changed$.subscribe(() => {
      this.loadWorkspaces()
    })
  }

  ngAfterViewInit(): void {
    // Hack: Override Tabby's settings-tab-body max-width restriction
    setTimeout(() => {
      const parent = this.elementRef.nativeElement.closest('settings-tab-body') as HTMLElement
      if (parent) {
        parent.style.maxWidth = '1024px'
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
    this.editingWorkspace = JSON.parse(JSON.stringify(workspace))
  }

  isSelected(workspace: Workspace): boolean {
    return this.selectedWorkspace?.id === workspace.id
  }

  ngOnDestroy(): void {
    this.configSubscription?.unsubscribe()
  }

  loadWorkspaces(): void {
    this.workspaces = this.workspaceService.getWorkspaces()
    this.cdr.detectChanges()
  }

  async createWorkspace(): Promise<void> {
    const profiles = await this.workspaceService.getAvailableProfiles()
    const defaultProfileId = profiles[0]?.id || ''
    const workspace = createDefaultWorkspace()
    this.setProfileForAllPanes(workspace.root, defaultProfileId)
    this.selectedWorkspace = null
    this.editingWorkspace = workspace
    this.isCreatingNew = true
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

  async duplicateWorkspace(workspace: Workspace): Promise<void> {
    const clone = this.workspaceService.duplicateWorkspace(workspace)
    await this.workspaceService.addWorkspace(clone)
    this.loadWorkspaces()
  }

  async deleteWorkspace(workspace: Workspace): Promise<void> {
    if (confirm(`Delete workspace "${workspace.name}"?`)) {
      const currentIndex = this.workspaces.findIndex((w) => w.id === workspace.id)
      await this.workspaceService.deleteWorkspace(workspace.id)
      this.loadWorkspaces()

      // Select next workspace after deletion
      if (this.workspaces.length > 0) {
        const nextIndex = Math.min(currentIndex, this.workspaces.length - 1)
        this.selectWorkspace(this.workspaces[nextIndex])
      } else {
        this.selectedWorkspace = null
        this.editingWorkspace = null
        this.isCreatingNew = false
      }
    }
  }

  async onEditorSave(workspace: Workspace): Promise<void> {
    const isNew = !this.workspaces.find((w) => w.id === workspace.id)
    if (isNew) {
      await this.workspaceService.addWorkspace(workspace)
    } else {
      await this.workspaceService.updateWorkspace(workspace)
    }
    this.loadWorkspaces()
    this.isCreatingNew = false

    // Select the saved workspace
    const saved = this.workspaces.find((w) => w.id === workspace.id)
    if (saved) {
      this.selectWorkspace(saved)
    }
  }

  async onEditorRun(workspace: Workspace): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true

    try {
      // Save first
      await this.onEditorSave(workspace)

      // Then open the workspace
      const commands = this.workspaceService.collectStartupCommands(workspace)
      if (commands.length > 0) {
        this.startupService.registerCommands(commands)
      }

      const profile = await this.workspaceService.generateTabbyProfile(workspace)
      this.profilesService.openNewTabForProfile(profile)
    } finally {
      this.isRunning = false
    }
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
      }
    } else if (this.selectedWorkspace) {
      // Reset to original workspace data
      this.editingWorkspace = JSON.parse(JSON.stringify(this.selectedWorkspace))
    }
    this.cdr.detectChanges()
  }

  getPaneCount(workspace: Workspace): number {
    return countPanes(workspace.root)
  }

  getOrientationLabel(workspace: Workspace): string {
    return workspace.root.orientation === 'horizontal' ? 'horizontal' : 'vertical'
  }

  async setAsDefault(workspace: Workspace): Promise<void> {
    this.workspaces.forEach((w) => (w.isDefault = false))
    workspace.isDefault = true
    await this.workspaceService.saveWorkspaces(this.workspaces)
    this.loadWorkspaces()
  }
}
