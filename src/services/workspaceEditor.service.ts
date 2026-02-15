import { Injectable } from '@angular/core'
import { ConfigService, NotificationsService, ProfilesService } from 'tabby-core'
import {
  Workspace,
  WorkspacePane,
  WorkspaceSplit,
  isWorkspaceSplit,
  generateUUID,
  deepClone,
  TabbyProfile,
  TabbyRecoveryToken,
  TabbySplitLayoutProfile,
} from '../models/workspace.model'
import { CONFIG_KEY, DISPLAY_NAME } from '../build-config'
import { PendingCommand } from './startupCommand.service'

@Injectable({ providedIn: 'root' })
export class WorkspaceEditorService {
  private cachedProfiles: TabbyProfile[] | null = null
  private cacheTimestamp: number = 0
  private readonly CACHE_TTL = 30000 // 30 seconds

  constructor(
    private config: ConfigService,
    private notifications: NotificationsService,
    private profilesService: ProfilesService
  ) {}

  private async getCachedProfiles(): Promise<TabbyProfile[]> {
    const now = Date.now()
    if (!this.cachedProfiles || now - this.cacheTimestamp > this.CACHE_TTL) {
      this.cachedProfiles = (await this.profilesService.getProfiles()) as TabbyProfile[]
      this.cacheTimestamp = now
    }
    return this.cachedProfiles
  }

  /** Returns all saved workspaces from config. */
  getWorkspaces(): Workspace[] {
    return this.config.store?.[CONFIG_KEY]?.workspaces ?? []
  }

  /**
   * Saves the workspace list to config.
   * @throws Error if config store is not initialized
   */
  async saveWorkspaces(workspaces: Workspace[]): Promise<void> {
    if (!this.config.store?.[CONFIG_KEY]) {
      throw new Error('Config store not initialized')
    }
    this.config.store[CONFIG_KEY].workspaces = workspaces
    await this.saveConfig()
  }

  /** Adds a new workspace and shows notification. */
  async addWorkspace(workspace: Workspace): Promise<void> {
    try {
      const workspaces = this.getWorkspaces()
      workspaces.push(workspace)
      await this.saveWorkspaces(workspaces)
      this.notifications.info(`Workspace "${workspace.name}" created`)
    } catch (error) {
      this.notifications.error(`Failed to create workspace "${workspace.name}"`)
      throw error
    }
  }

  /** Updates an existing workspace by ID and shows notification. */
  async updateWorkspace(workspace: Workspace): Promise<void> {
    try {
      const workspaces = this.getWorkspaces()
      const index = workspaces.findIndex((w) => w.id === workspace.id)
      if (index !== -1) {
        workspaces[index] = workspace
        await this.saveWorkspaces(workspaces)
        this.notifications.info(`Workspace "${workspace.name}" updated`)
      }
    } catch (error) {
      this.notifications.error(`Failed to update workspace "${workspace.name}"`)
      throw error
    }
  }

  /** Deletes a workspace by ID and shows notification. */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    const workspaces = this.getWorkspaces()
    const workspace = workspaces.find((w) => w.id === workspaceId)
    try {
      const filtered = workspaces.filter((w) => w.id !== workspaceId)
      await this.saveWorkspaces(filtered)
      if (workspace) {
        this.notifications.info(`Workspace "${workspace.name}" deleted`)
      }
    } catch (error) {
      this.notifications.error(`Failed to delete workspace "${workspace?.name || workspaceId}"`)
      throw error
    }
  }

  /** Returns all local shell profiles available for use in workspaces. */
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
      console.log(`[${DISPLAY_NAME}] Cleaned up ${profiles.length - filtered.length} orphaned profiles`)
    }
  }

  /** Generates a Tabby split-layout profile from a workspace for opening. */
  async generateTabbyProfile(workspace: Workspace): Promise<TabbySplitLayoutProfile> {
    await this.getCachedProfiles()
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
        recoveryToken: this.generateRecoveryToken(workspace.root, workspace.name, workspace.id),
      },
    }
  }

  private generateRecoveryToken(split: WorkspaceSplit, workspaceName: string, workspaceId: string): TabbyRecoveryToken {
    return {
      type: 'app:split-tab',
      orientation: split.orientation === 'horizontal' ? 'h' : 'v',
      ratios: split.ratios,
      workspaceId,
      children: split.children.map((child) => {
        if (isWorkspaceSplit(child)) {
          return this.generateRecoveryToken(child, workspaceName, workspaceId)
        }
        return this.generatePaneToken(child, workspaceName, workspaceId)
      }),
    }
  }

  private generatePaneToken(pane: WorkspacePane, workspaceName: string, workspaceId: string): TabbyRecoveryToken {
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
      cwd: this.resolveWslCwd(pane.cwd || baseProfile.options?.cwd || '', baseProfile),
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
      disableDynamicTitle: true,
      weight: 0,
      isBuiltin: false,
      isTemplate: false,
      terminalColorScheme: null,
      behaviorOnSessionEnd: 'auto',
    }

    // tabTitle: workspace name (what user sees)
    // tabCustomTitle: pane.id (for matching in StartupCommandService)
    // workspaceId: for duplicate detection after Tabby recovery
    const cwd = this.resolveWslCwd(pane.cwd || baseProfile.options?.cwd || '', baseProfile)
    return {
      type: 'app:local-tab',
      profile,
      savedState: false,
      tabTitle: workspaceName,
      tabCustomTitle: pane.id,
      workspaceId,
      disableDynamicTitle: true,
      cwd,
    }
  }

  /** Creates a deep copy of a workspace with new IDs. */
  duplicateWorkspace(workspace: Workspace): Workspace {
    const clone = deepClone(workspace)
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

  private isWslProfile(profile: TabbyProfile): boolean {
    return profile.type?.startsWith('local:wsl') ?? false
  }

  private getWslDistroName(profile: TabbyProfile): string | null {
    // From type: 'local:wsl-Ubuntu-22.04' → 'Ubuntu-22.04'
    if (profile.type?.startsWith('local:wsl-')) {
      return profile.type.substring('local:wsl-'.length)
    }
    // From args: ['-d', 'Ubuntu']
    const args = profile.options?.args || []
    const dIdx = args.indexOf('-d')
    if (dIdx >= 0 && dIdx + 1 < args.length) {
      return args[dIdx + 1]
    }
    return null
  }

  /**
   * Converts Unix CWD paths to Windows UNC format for WSL profiles.
   * Tabby validates CWD with fsSync.existsSync() which fails for Unix paths on Windows.
   * UNC paths (\\wsl.localhost\<distro>\<path>) are resolved by Windows via WSL filesystem.
   */
  private resolveWslCwd(cwd: string, profile: TabbyProfile): string {
    if (!cwd || !cwd.startsWith('/') || !this.isWslProfile(profile)) {
      return cwd
    }
    const distro = this.getWslDistroName(profile)
    if (!distro) {
      return cwd
    }
    // /home/user/project → \\wsl.localhost\Ubuntu\home\user\project
    const winPath = cwd.replace(/\//g, '\\')
    return `\\\\wsl.localhost\\${distro}${winPath}`
  }

  private getProfileById(profileId: string): TabbyProfile | undefined {
    const isLocalType = (type: string) => type === 'local' || type?.startsWith('local:')

    // First: check user profiles in config
    const userProfiles: TabbyProfile[] = this.config.store?.profiles ?? []
    const found = userProfiles.find((p) => p.id === profileId && isLocalType(p.type))
    if (found) return found

    // Fallback: check cached profiles (includes built-ins)
    return this.cachedProfiles?.find((p) => p.id === profileId && isLocalType(p.type))
  }

  /** Collects all startup commands from panes in a workspace. */
  collectStartupCommands(workspace: Workspace): PendingCommand[] {
    const commands: PendingCommand[] = []
    this.collectCommandsFromNode(workspace.root, workspace.name, commands)
    return commands
  }

  private collectCommandsFromNode(
    node: WorkspacePane | WorkspaceSplit,
    workspaceName: string,
    commands: PendingCommand[]
  ): void {
    if (isWorkspaceSplit(node)) {
      for (const child of node.children) {
        this.collectCommandsFromNode(child, workspaceName, commands)
      }
    } else if (node.startupCommand) {
      commands.push({
        paneId: node.id,
        command: node.startupCommand,
        originalTitle: workspaceName,
      })
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await this.config.save()
    } catch (error) {
      console.error('TabbySpaces save error:', error)
      throw error
    }
  }
}
