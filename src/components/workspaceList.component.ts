import { Component, OnInit } from '@angular/core'
import { ConfigService } from 'tabby-core'
import { WorkspaceEditorService } from '../services/workspaceEditor.service'
import { Workspace, countPanes, createDefaultWorkspace } from '../models/workspace.model'

@Component({
  selector: 'workspace-list',
  template: require('./workspaceList.component.pug'),
  styles: [require('./workspaceList.component.scss')],
})
export class WorkspaceListComponent implements OnInit {
  workspaces: Workspace[] = []
  editingWorkspace: Workspace | null = null
  showEditor = false

  constructor(
    public config: ConfigService,
    private workspaceService: WorkspaceEditorService
  ) {}

  ngOnInit(): void {
    this.loadWorkspaces()
  }

  loadWorkspaces(): void {
    this.workspaces = this.workspaceService.getWorkspaces()
  }

  createWorkspace(): void {
    this.editingWorkspace = createDefaultWorkspace()
    this.showEditor = true
  }

  editWorkspace(workspace: Workspace): void {
    this.editingWorkspace = JSON.parse(JSON.stringify(workspace))
    this.showEditor = true
  }

  duplicateWorkspace(workspace: Workspace): void {
    const clone = this.workspaceService.duplicateWorkspace(workspace)
    this.workspaceService.addWorkspace(clone)
    this.loadWorkspaces()
  }

  deleteWorkspace(workspace: Workspace): void {
    if (confirm(`Delete workspace "${workspace.name}"?`)) {
      this.workspaceService.deleteWorkspace(workspace.id)
      this.loadWorkspaces()
    }
  }

  onEditorSave(workspace: Workspace): void {
    const existing = this.workspaces.find((w) => w.id === workspace.id)
    if (existing) {
      this.workspaceService.updateWorkspace(workspace)
    } else {
      this.workspaceService.addWorkspace(workspace)
    }
    this.loadWorkspaces()
    this.closeEditor()
  }

  closeEditor(): void {
    this.showEditor = false
    this.editingWorkspace = null
  }

  getPaneCount(workspace: Workspace): number {
    return countPanes(workspace.root)
  }

  getOrientationLabel(workspace: Workspace): string {
    return workspace.root.orientation === 'horizontal' ? 'horizontal' : 'vertical'
  }

  setAsDefault(workspace: Workspace): void {
    this.workspaces.forEach((w) => (w.isDefault = false))
    workspace.isDefault = true
    this.workspaceService.saveWorkspaces(this.workspaces)
    this.loadWorkspaces()
  }
}
