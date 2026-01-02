import { Injectable } from '@angular/core'
import { ConfigService, NotificationsService, ProfilesService } from 'tabby-core'
import {
  Workspace,
  WorkspacePane,
  WorkspaceSplit,
  isWorkspaceSplit,
  generateUUID,
} from '../models/workspace.model'

@Injectable({ providedIn: 'root' })
export class WorkspaceEditorService {
  constructor(
    private config: ConfigService,
    private notifications: NotificationsService,
    private profilesService: ProfilesService
  ) {}

  getWorkspaces(): Workspace[] {
    return this.config.store.tabbyspaces?.workspaces ?? []
  }

  saveWorkspaces(workspaces: Workspace[]): void {
    this.config.store.tabbyspaces = {
      ...this.config.store.tabbyspaces,
      workspaces,
    }
    this.config.save()
    this.syncTabbyProfiles(workspaces)
  }

  addWorkspace(workspace: Workspace): void {
    const workspaces = this.getWorkspaces()
    workspaces.push(workspace)
    this.saveWorkspaces(workspaces)
    this.notifications.info(`Workspace "${workspace.name}" created`)
  }

  updateWorkspace(workspace: Workspace): void {
    const workspaces = this.getWorkspaces()
    const index = workspaces.findIndex((w) => w.id === workspace.id)
    if (index !== -1) {
      workspaces[index] = workspace
      this.saveWorkspaces(workspaces)
      this.notifications.info(`Workspace "${workspace.name}" updated`)
    }
  }

  deleteWorkspace(workspaceId: string): void {
    const workspaces = this.getWorkspaces()
    const workspace = workspaces.find((w) => w.id === workspaceId)
    const filtered = workspaces.filter((w) => w.id !== workspaceId)
    this.saveWorkspaces(filtered)
    this.removeTabbyProfile(workspaceId)
    if (workspace) {
      this.notifications.info(`Workspace "${workspace.name}" deleted`)
    }
  }

  getAvailableProfiles(): any[] {
    return this.config.store.profiles?.filter(
      (p: any) => p.type === 'local'
    ) ?? []
  }

  private syncTabbyProfiles(workspaces: Workspace[]): void {
    const profiles = this.config.store.profiles ?? []

    // Remove old tabbyspaces profiles
    const filteredProfiles = profiles.filter(
      (p: any) => !p.id?.startsWith('split-layout:tabbyspaces:')
    )

    // Add new workspace profiles
    for (const workspace of workspaces) {
      const tabbyProfile = this.generateTabbyProfile(workspace)
      filteredProfiles.push(tabbyProfile)
    }

    this.config.store.profiles = filteredProfiles
  }

  private removeTabbyProfile(workspaceId: string): void {
    const profiles = this.config.store.profiles ?? []
    this.config.store.profiles = profiles.filter(
      (p: any) => !p.id?.includes(workspaceId)
    )
  }

  generateTabbyProfile(workspace: Workspace): any {
    return {
      id: `split-layout:tabbyspaces:${workspace.name.toLowerCase().replace(/\s+/g, '-')}:${workspace.id}`,
      type: 'split-layout',
      name: workspace.name,
      icon: workspace.icon,
      color: workspace.color,
      isBuiltin: false,
      options: {
        recoveryToken: this.generateRecoveryToken(workspace.root),
      },
    }
  }

  private generateRecoveryToken(split: WorkspaceSplit): any {
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

  private generatePaneToken(pane: WorkspacePane): any {
    const baseProfile = this.getAvailableProfiles().find(
      (p) => p.id === pane.profileId
    )

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
}
