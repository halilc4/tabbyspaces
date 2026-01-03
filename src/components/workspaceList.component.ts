import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'
import { ConfigService } from 'tabby-core'
import { Subscription } from 'rxjs'
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
export class WorkspaceListComponent implements OnInit, OnDestroy {
  workspaces: Workspace[] = []
  editingWorkspace: Workspace | null = null
  showEditor = false
  private configSubscription: Subscription | null = null

  constructor(
    public config: ConfigService,
    private workspaceService: WorkspaceEditorService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadWorkspaces()
    this.configSubscription = this.config.changed$.subscribe(() => {
      this.loadWorkspaces()
    })
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
    this.editingWorkspace = workspace
    this.showEditor = true
  }

  private setProfileForAllPanes(node: WorkspacePane | WorkspaceSplit, profileId: string): void {
    if (isWorkspaceSplit(node)) {
      node.children.forEach((child) => this.setProfileForAllPanes(child, profileId))
    } else {
      node.profileId = profileId
    }
  }

  editWorkspace(workspace: Workspace): void {
    this.editingWorkspace = JSON.parse(JSON.stringify(workspace))
    this.showEditor = true
  }

  async duplicateWorkspace(workspace: Workspace): Promise<void> {
    const clone = this.workspaceService.duplicateWorkspace(workspace)
    await this.workspaceService.addWorkspace(clone)
    this.loadWorkspaces()
  }

  async deleteWorkspace(workspace: Workspace): Promise<void> {
    console.log('[TabbySpaces] deleteWorkspace called', workspace.id)
    if (confirm(`Delete workspace "${workspace.name}"?`)) {
      console.log('[TabbySpaces] confirm = true, calling service.deleteWorkspace')
      await this.workspaceService.deleteWorkspace(workspace.id)
      console.log('[TabbySpaces] service.deleteWorkspace done, calling loadWorkspaces')
      this.loadWorkspaces()
      console.log('[TabbySpaces] loadWorkspaces done, workspaces:', this.workspaces.length)
    }
  }

  async onEditorSave(workspace: Workspace): Promise<void> {
    console.log('[TabbySpaces] onEditorSave called', workspace.id, workspace.name)
    const existing = this.workspaces.find((w) => w.id === workspace.id)
    console.log('[TabbySpaces] existing workspace?', !!existing)
    if (existing) {
      await this.workspaceService.updateWorkspace(workspace)
    } else {
      await this.workspaceService.addWorkspace(workspace)
    }
    console.log('[TabbySpaces] save done, calling loadWorkspaces')
    this.loadWorkspaces()
    console.log('[TabbySpaces] calling closeEditor')
    this.closeEditor()
    console.log('[TabbySpaces] closeEditor done, showEditor:', this.showEditor)
  }

  closeEditor(): void {
    console.log('[TabbySpaces] closeEditor called, showEditor before:', this.showEditor)
    this.showEditor = false
    this.editingWorkspace = null
    this.cdr.detectChanges()
    console.log('[TabbySpaces] closeEditor done, showEditor after:', this.showEditor)
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
