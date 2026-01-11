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
import { PendingCommand } from './startupCommand.service'

@Injectable({ providedIn: 'root' })
export class WorkspaceEditorService {
  private cachedProfiles: TabbyProfile[] = []

  constructor(
    private config: ConfigService,
    private notifications: NotificationsService,
    private profilesService: ProfilesService
  ) {}

  private async cacheProfiles(): Promise<void> {
    this.cachedProfiles = (await this.profilesService.getProfiles()) as TabbyProfile[]
  }

  getWorkspaces(): Workspace[] {
    return this.config.store?.[CONFIG_KEY]?.workspaces ?? []
  }

  async saveWorkspaces(workspaces: Workspace[]): Promise<boolean> {
    if (!this.config.store?.[CONFIG_KEY]) {
      return false
    }
    this.config.store[CONFIG_KEY].workspaces = workspaces
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
      (p) =>
        (p.type === 'local' || p.type?.startsWith('local:')) &&
        !p.id?.startsWith('split-layout:')
    ) as TabbyProfile[]
  }

  /**
   * Cleanup orphaned profiles from previous plugin versions.
   * Call this once on plugin init.
   */
  cleanupOrphanedProfiles(): void {
    if (!this.config.store?.profiles) {
      return
    }
    const profiles: TabbyProfile[] = this.config.store.profiles
    const prefix = `split-layout:${CONFIG_KEY}:`
    const filtered = profiles.filter((p) => !p.id?.startsWith(prefix))
    if (filtered.length !== profiles.length) {
      this.config.store.profiles = filtered
      this.config.save()
      console.log(`[TabbySpaces] Cleaned up ${profiles.length - filtered.length} orphaned profiles`)
    }
  }

  async generateTabbyProfile(workspace: Workspace): Promise<TabbySplitLayoutProfile> {
    await this.cacheProfiles()
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

    // Note: startupCommand is handled via sendInput() in StartupCommandService
    // to avoid re-execution when Tabby splits the pane

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

    // Use pane.id for matching in StartupCommandService
    // Original title will be restored after command execution
    const cwd = pane.cwd || baseProfile.options?.cwd || ''
    return {
      type: 'app:local-tab',
      profile,
      savedState: false,
      tabTitle: pane.id,
      tabCustomTitle: pane.id,
      disableDynamicTitle: false,
      cwd,
    }
  }

  duplicateWorkspace(workspace: Workspace): Workspace {
    const clone = JSON.parse(JSON.stringify(workspace)) as Workspace
    clone.id = generateUUID()
    clone.name = `${workspace.name} (Copy)`
    clone.launchOnStartup = false
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
    const isLocalType = (type: string) => type === 'local' || type?.startsWith('local:')

    // First: check user profiles in config
    const userProfiles: TabbyProfile[] = this.config.store?.profiles ?? []
    const found = userProfiles.find((p) => p.id === profileId && isLocalType(p.type))
    if (found) return found

    // Fallback: check cached profiles (includes built-ins)
    return this.cachedProfiles.find((p) => p.id === profileId && isLocalType(p.type))
  }

  collectStartupCommands(workspace: Workspace): PendingCommand[] {
    const commands: PendingCommand[] = []
    this.collectCommandsFromNode(workspace.root, commands)
    return commands
  }

  private collectCommandsFromNode(
    node: WorkspacePane | WorkspaceSplit,
    commands: PendingCommand[]
  ): void {
    if (isWorkspaceSplit(node)) {
      for (const child of node.children) {
        this.collectCommandsFromNode(child, commands)
      }
    } else if (node.startupCommand) {
      commands.push({
        paneId: node.id,
        command: node.startupCommand,
        originalTitle: node.title || '',
      })
    }
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
