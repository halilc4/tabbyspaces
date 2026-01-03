import { Injectable } from '@angular/core'
import { ConfigService, NotificationsService, ProfilesService } from 'tabby-core'
import {
  Workspace,
  WorkspacePane,
  WorkspaceSplit,
  isWorkspaceSplit,
  generateUUID,
  TabbyProfile,
  TabbyRecoveryToken,
  TabbySplitLayoutProfile,
} from '../models/workspace.model'
import { CONFIG_KEY, DISPLAY_NAME } from '../build-config'

@Injectable({ providedIn: 'root' })
export class WorkspaceEditorService {
  constructor(
    private config: ConfigService,
    private notifications: NotificationsService,
    private profilesService: ProfilesService
  ) {}

  getWorkspaces(): Workspace[] {
    return this.config.store[CONFIG_KEY]?.workspaces ?? []
  }

  async saveWorkspaces(workspaces: Workspace[]): Promise<boolean> {
    this.config.store[CONFIG_KEY].workspaces = workspaces
    this.syncTabbyProfiles(workspaces)
    return await this.saveConfig()
  }

  async addWorkspace(workspace: Workspace): Promise<void> {
    const workspaces = this.getWorkspaces()
    workspaces.push(workspace)
    await this.saveWorkspaces(workspaces)
    this.notifications.info(`Workspace "${workspace.name}" created`)
  }

  async updateWorkspace(workspace: Workspace): Promise<void> {
    const workspaces = this.getWorkspaces()
    const index = workspaces.findIndex((w) => w.id === workspace.id)
    if (index !== -1) {
      workspaces[index] = workspace
      await this.saveWorkspaces(workspaces)
      this.notifications.info(`Workspace "${workspace.name}" updated`)
    }
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const workspaces = this.getWorkspaces()
    const workspace = workspaces.find((w) => w.id === workspaceId)
    const filtered = workspaces.filter((w) => w.id !== workspaceId)
    await this.saveWorkspaces(filtered)
    if (workspace) {
      this.notifications.info(`Workspace "${workspace.name}" deleted`)
    }
  }

  async getAvailableProfiles(): Promise<TabbyProfile[]> {
    const allProfiles = await this.profilesService.getProfiles()
    return allProfiles.filter(
      (p) => p.type === 'local' && !p.id?.startsWith('split-layout:')
    ) as TabbyProfile[]
  }

  private syncTabbyProfiles(workspaces: Workspace[]): void {
    const profiles: (TabbyProfile | TabbySplitLayoutProfile)[] = this.config.store.profiles ?? []

    // Remove old plugin profiles (mutate in place)
    for (let i = profiles.length - 1; i >= 0; i--) {
      if (profiles[i].id?.startsWith(`split-layout:${CONFIG_KEY}:`)) {
        profiles.splice(i, 1)
      }
    }

    // Add new workspace profiles
    for (const workspace of workspaces) {
      const tabbyProfile = this.generateTabbyProfile(workspace)
      profiles.push(tabbyProfile)
    }
  }

  generateTabbyProfile(workspace: Workspace): TabbySplitLayoutProfile {
    const safeName = this.sanitizeForProfileId(workspace.name)
    return {
      id: `split-layout:${CONFIG_KEY}:${safeName}:${workspace.id}`,
      type: 'split-layout',
      name: workspace.name,
      group: DISPLAY_NAME,
      icon: workspace.icon,
      color: workspace.color,
      isBuiltin: false,
      options: {
        recoveryToken: this.generateRecoveryToken(workspace.root),
      },
    }
  }

  private generateRecoveryToken(split: WorkspaceSplit): TabbyRecoveryToken {
    return {
      type: 'app:split-tab',
      orientation: split.orientation === 'horizontal' ? 'h' : 'v',
      ratios: split.ratios,
      children: split.children.map((child) => {
        if (isWorkspaceSplit(child)) {
          return this.generateRecoveryToken(child)
        }
        return this.generatePaneToken(child)
      }),
    }
  }

  private generatePaneToken(pane: WorkspacePane): TabbyRecoveryToken {
    const baseProfile = this.getProfileById(pane.profileId)

    if (!baseProfile) {
      return {
        type: 'app:local-tab',
        profile: {
          type: 'local',
          name: 'Shell',
        },
        savedState: false,
      }
    }

    // Build complete profile object like Tabby expects
    const options = {
      restoreFromPTYID: false,
      command: baseProfile.options?.command || '',
      args: baseProfile.options?.args || [],
      cwd: pane.cwd || baseProfile.options?.cwd || '',
      env: baseProfile.options?.env || {},
      width: null,
      height: null,
      pauseAfterExit: false,
      runAsAdministrator: false,
    }

    // Handle startup command for different shells
    if (pane.startupCommand) {
      const cmd = baseProfile.options?.command || ''
      if (cmd.includes('nu.exe') || baseProfile.name?.toLowerCase().includes('nushell')) {
        options.args = ['-e', pane.startupCommand]
      } else if (cmd.includes('powershell') || cmd.includes('pwsh')) {
        options.args = ['-NoExit', '-Command', pane.startupCommand]
      } else if (cmd.includes('cmd.exe')) {
        options.args = ['/K', pane.startupCommand]
      } else {
        options.args = ['-c', pane.startupCommand]
      }
    }

    const profile = {
      id: baseProfile.id,
      type: 'local',
      name: baseProfile.name || 'Shell',
      group: baseProfile.group || '',
      options,
      icon: baseProfile.icon || '',
      color: baseProfile.color || '',
      disableDynamicTitle: false,
      weight: 0,
      isBuiltin: false,
      isTemplate: false,
      terminalColorScheme: null,
      behaviorOnSessionEnd: 'auto',
    }

    return {
      type: 'app:local-tab',
      profile,
      savedState: false,
      tabTitle: pane.title || '',
      tabCustomTitle: pane.title || '',
      disableDynamicTitle: !!pane.title,
    }
  }

  duplicateWorkspace(workspace: Workspace): Workspace {
    const clone = JSON.parse(JSON.stringify(workspace)) as Workspace
    clone.id = generateUUID()
    clone.name = `${workspace.name} (Copy)`
    clone.isDefault = false
    this.regenerateIds(clone.root)
    return clone
  }

  private regenerateIds(node: WorkspacePane | WorkspaceSplit): void {
    if (isWorkspaceSplit(node)) {
      for (const child of node.children) {
        this.regenerateIds(child)
      }
    } else {
      node.id = generateUUID()
    }
  }

  private sanitizeForProfileId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'workspace'
  }

  private getProfileById(profileId: string): TabbyProfile | undefined {
    const profiles: TabbyProfile[] = this.config.store.profiles ?? []
    return profiles.find((p) => p.id === profileId && p.type === 'local')
  }

  getProfileName(profileId: string): string | undefined {
    return this.getProfileById(profileId)?.name
  }

  private async saveConfig(): Promise<boolean> {
    try {
      await this.config.save()
      return true
    } catch (error) {
      this.notifications.error('Failed to save configuration')
      console.error('TabbySpaces save error:', error)
      return false
    }
  }
}
