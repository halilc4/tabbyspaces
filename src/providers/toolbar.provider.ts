import { Injectable } from '@angular/core'
import { ToolbarButtonProvider, ToolbarButton, ProfilesService, AppService } from 'tabby-core'
import { WorkspaceEditorService } from '../services/workspaceEditor.service'

@Injectable()
export class WorkspaceToolbarProvider extends ToolbarButtonProvider {
  constructor(
    private workspaceService: WorkspaceEditorService,
    private profilesService: ProfilesService,
    private app: AppService
  ) {
    super()
  }

  provide(): ToolbarButton[] {
    return [
      {
        icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
        </svg>`,
        title: 'Workspaces',
        weight: 5,
        click: () => this.showWorkspaceSelector()
      }
    ]
  }

  private async showWorkspaceSelector(): Promise<void> {
    const workspaces = this.workspaceService.getWorkspaces()

    if (workspaces.length === 0) {
      return
    }

    const options = workspaces.map((ws) => ({
      name: ws.name,
      description: `${this.countPanes(ws.root)} panes`,
      icon: ws.icon || 'grid',
      color: ws.color,
      result: ws.id
    }))

    const selectedId = await this.app.showSelector('Select Workspace', options)

    if (selectedId) {
      this.openWorkspace(selectedId)
    }
  }

  private countPanes(node: any): number {
    if (node.children) {
      return node.children.reduce((sum: number, child: any) => sum + this.countPanes(child), 0)
    }
    return 1
  }

  private openWorkspace(workspaceId: string): void {
    const workspaces = this.workspaceService.getWorkspaces()
    const workspace = workspaces.find((w) => w.id === workspaceId)

    if (!workspace) return

    const profile = this.workspaceService.generateTabbyProfile(workspace)
    this.profilesService.openNewTabForProfile(profile)
  }
}
