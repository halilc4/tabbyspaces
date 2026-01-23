import { Injectable } from '@angular/core'
import { AppService, SplitTabComponent } from 'tabby-core'
import { WorkspaceEditorService } from './workspaceEditor.service'
import { WorkspaceBackground } from '../models/workspace.model'
import { CONFIG_KEY } from '../build-config'

/**
 * Service for applying custom backgrounds to workspace tabs.
 * Injects CSS dynamically based on workspace configuration.
 */
@Injectable({ providedIn: 'root' })
export class WorkspaceBackgroundService {
  private styleElement: HTMLStyleElement | null = null
  private appliedWorkspaces = new Map<string, string>() // workspaceId -> CSS

  constructor(
    private app: AppService,
    private workspaceService: WorkspaceEditorService
  ) {}

  /**
   * Initialize the service by setting up tab event listeners.
   * Must be called once during app initialization.
   */
  initialize(): void {
    this.setupTabListeners()
  }

  private setupTabListeners(): void {
    // Listen for tab open
    this.app.tabOpened$.subscribe(tab => this.onTabOpened(tab))

    // Listen for tab close - cleanup
    this.app.tabClosed$.subscribe(tab => this.onTabClosed(tab))
  }

  private onTabOpened(tab: unknown): void {
    if (!(tab instanceof SplitTabComponent)) return

    // Small delay to let Angular finish rendering
    setTimeout(() => {
      const workspaceId = this.extractWorkspaceId(tab)
      if (!workspaceId) return

      const workspace = this.workspaceService.getWorkspaces()
        .find(w => w.id === workspaceId)

      if (workspace?.background && workspace.background.type !== 'none') {
        this.applyBackground(workspaceId, workspace.background)
      }
    }, 200)
  }

  private onTabClosed(tab: unknown): void {
    if (!(tab instanceof SplitTabComponent)) return

    const workspaceId = this.extractWorkspaceId(tab)
    if (workspaceId) {
      this.removeBackground(workspaceId)
    }
  }

  /**
   * Extract workspace ID from a SplitTabComponent.
   * Tries multiple strategies: _recoveredState and child profile ID.
   */
  private extractWorkspaceId(tab: SplitTabComponent): string | undefined {
    const tabAny = tab as any

    // Strategy 1: Check _recoveredState.workspaceId (for restored tabs)
    if (tabAny._recoveredState?.workspaceId) {
      return tabAny._recoveredState.workspaceId
    }

    // Strategy 2: Extract from child profile ID (for freshly opened tabs)
    const profilePrefix = `split-layout:${CONFIG_KEY}:`
    for (const child of tab.getAllTabs()) {
      const profileId = (child as any).profile?.id ?? ''
      if (profileId.startsWith(profilePrefix)) {
        // Profile ID format: split-layout:CONFIG_KEY:name:UUID
        const parts = profileId.split(':')
        return parts[parts.length - 1]
      }
    }

    return undefined
  }

  private applyBackground(workspaceId: string, bg: WorkspaceBackground): void {
    // Mark split-tab element with data attribute
    this.markSplitTabElement(workspaceId)

    // Generate and inject CSS
    const css = this.generateCSS(workspaceId, bg)
    this.injectCSS(workspaceId, css)
  }

  private markSplitTabElement(workspaceId: string): void {
    // Find split-tab that doesn't have a workspace-id yet
    const splitTabs = document.querySelectorAll('split-tab')
    for (let i = splitTabs.length - 1; i >= 0; i--) {
      const splitTab = splitTabs[i]
      if (!splitTab.hasAttribute('data-workspace-id')) {
        splitTab.setAttribute('data-workspace-id', workspaceId)
        break
      }
    }
  }

  private generateCSS(workspaceId: string, bg: WorkspaceBackground): string {
    if (bg.type === 'none' || !bg.value) return ''

    return `
      split-tab[data-workspace-id="${workspaceId}"] {
        background: ${bg.value} !important;
      }
      split-tab[data-workspace-id="${workspaceId}"] .xterm-viewport,
      split-tab[data-workspace-id="${workspaceId}"] .xterm-screen {
        background: transparent !important;
      }
    `
  }

  private injectCSS(workspaceId: string, css: string): void {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style')
      this.styleElement.id = 'tabbyspaces-backgrounds'
      document.head.appendChild(this.styleElement)
    }

    this.appliedWorkspaces.set(workspaceId, css)
    this.updateStyleElement()
  }

  private removeBackground(workspaceId: string): void {
    this.appliedWorkspaces.delete(workspaceId)
    this.updateStyleElement()
  }

  private updateStyleElement(): void {
    if (this.styleElement) {
      this.styleElement.textContent = Array.from(this.appliedWorkspaces.values()).join('\n')
    }
  }

  /**
   * Refresh background for a specific workspace.
   * Call this when workspace background is updated in settings.
   */
  refreshWorkspaceBackground(workspaceId: string): void {
    const workspace = this.workspaceService.getWorkspaces()
      .find(w => w.id === workspaceId)

    if (!workspace) {
      this.removeBackground(workspaceId)
      return
    }

    if (workspace.background && workspace.background.type !== 'none') {
      const css = this.generateCSS(workspaceId, workspace.background)
      this.appliedWorkspaces.set(workspaceId, css)
    } else {
      this.appliedWorkspaces.delete(workspaceId)
    }
    this.updateStyleElement()
  }
}
