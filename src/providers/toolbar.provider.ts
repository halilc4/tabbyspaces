import { Injectable } from '@angular/core'
import { ToolbarButtonProvider, ToolbarButton, ProfilesService, AppService } from 'tabby-core'
import { WorkspaceEditorService } from '../services/workspaceEditor.service'
import { StartupCommandService } from '../services/startupCommand.service'
import { SettingsTabComponent } from 'tabby-settings'
import { CONFIG_KEY, DISPLAY_NAME, IS_DEV } from '../build-config'

const ICON_GRID = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="7" height="7"/>
  <rect x="14" y="3" width="7" height="7"/>
  <rect x="14" y="14" width="7" height="7"/>
  <rect x="3" y="14" width="7" height="7"/>
</svg>`

const ICON_BOLT = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
</svg>`
import { countPanes } from '../models/workspace.model'

@Injectable()
export class WorkspaceToolbarProvider extends ToolbarButtonProvider {
  constructor(
    private workspaceService: WorkspaceEditorService,
    private profilesService: ProfilesService,
    private app: AppService,
    private startupService: StartupCommandService
  ) {
    super()
    // Cleanup orphaned profiles from previous plugin versions (one-time migration)
    this.workspaceService.cleanupOrphanedProfiles()
  }

  provide(): ToolbarButton[] {
    return [
      {
        icon: IS_DEV ? ICON_BOLT : ICON_GRID,
        title: DISPLAY_NAME,
        weight: 5,
        click: () => this.showWorkspaceSelector()
      }
    ]
  }

  private async showWorkspaceSelector(): Promise<void> {
    const workspaces = this.workspaceService.getWorkspaces()

    if (workspaces.length === 0) {
      this.openSettings()
      return
    }

    const options = workspaces.map((ws) => ({
      name: ws.name,
      description: `${countPanes(ws.root)} panes`,
      icon: ws.icon || 'grid',
      color: ws.color,
      result: ws.id
    }))

    // Add option to open settings
    options.push({
      name: 'Manage Workspaces...',
      description: 'Create and edit workspaces',
      icon: 'cog',
      color: undefined,
      result: '__settings__'
    })

    const selectedId = await this.app.showSelector('Select Workspace', options)

    if (selectedId === '__settings__') {
      this.openSettings()
    } else if (selectedId) {
      this.openWorkspace(selectedId)
    }
  }

  private openSettings(): void {
    this.app.openNewTabRaw({ type: SettingsTabComponent, inputs: { activeTab: CONFIG_KEY } })
  }

  private async openWorkspace(workspaceId: string): Promise<void> {
    const workspaces = this.workspaceService.getWorkspaces()
    const workspace = workspaces.find((w) => w.id === workspaceId)

    if (!workspace) return

    // Register startup commands BEFORE opening the workspace
    // Commands will be sent via sendInput() when terminals open
    const commands = this.workspaceService.collectStartupCommands(workspace)
    if (commands.length > 0) {
      this.startupService.registerCommands(commands)
    }

    const profile = await this.workspaceService.generateTabbyProfile(workspace)
    this.profilesService.openNewTabForProfile(profile)
  }
}
