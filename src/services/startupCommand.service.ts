import { Injectable } from '@angular/core'
import { AppService, BaseTabComponent, SplitTabComponent } from 'tabby-core'
import { BaseTerminalTabComponent } from 'tabby-terminal'
import { first, timeout, of } from 'rxjs'
import { catchError } from 'rxjs/operators'

export interface PendingCommand {
  paneId: string
  command?: string
  originalTitle: string
}

/**
 * Handles startup commands for workspace panes.
 *
 * This service listens to tab open events and sends startup commands
 * to terminals that match registered pane IDs.
 *
 * NOTE: This is a module-level singleton that lives for the app lifetime.
 * The tabOpened$ subscription intentionally runs forever - no cleanup needed.
 */
@Injectable()
export class StartupCommandService {
  private pendingCommands: Map<string, PendingCommand> = new Map()

  constructor(private app: AppService) {
    this.app.tabOpened$.subscribe((tab) => this.onTabOpened(tab))
  }

  registerCommands(commands: PendingCommand[]): void {
    console.log('[TabbySpaces] Registering commands:', commands)
    for (const cmd of commands) {
      this.pendingCommands.set(cmd.paneId, cmd)
    }
  }

  private onTabOpened(tab: BaseTabComponent): void {
    console.log('[TabbySpaces] Tab opened:', {
      type: tab.constructor.name,
      title: tab.title,
    })

    // Handle SplitTabComponent - get all child terminal tabs
    if (tab instanceof SplitTabComponent) {
      console.log('[TabbySpaces] SplitTabComponent detected, waiting for children...')
      // Wait for split tab to fully initialize its children
      setTimeout(() => this.processChildTabs(tab), 300)
      return
    }

    // Handle individual terminal tab (shouldn't happen for split-layout, but just in case)
    if (tab instanceof BaseTerminalTabComponent) {
      this.processTerminalTab(tab)
    }
  }

  private processChildTabs(splitTab: SplitTabComponent): void {
    // Get all nested tabs from the split container
    const allTabs = splitTab.getAllTabs()
    console.log('[TabbySpaces] Found child tabs:', allTabs.length)

    for (const tab of allTabs) {
      if (tab instanceof BaseTerminalTabComponent) {
        this.processTerminalTab(tab)
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processTerminalTab(terminalTab: BaseTerminalTabComponent<any>): void {
    const paneId = terminalTab.customTitle || terminalTab.title
    console.log('[TabbySpaces] Processing terminal tab:', {
      title: terminalTab.title,
      customTitle: terminalTab.customTitle,
      paneId,
      pendingKeys: [...this.pendingCommands.keys()],
    })

    const pending = this.pendingCommands.get(paneId)
    if (!pending) {
      console.log('[TabbySpaces] No matching command for paneId:', paneId)
      return
    }

    this.pendingCommands.delete(paneId)

    // Build startup command (cd + command)
    const fullCommand = this.buildFullCommand(pending)
    if (!fullCommand) {
      console.log('[TabbySpaces] No command to send (no cwd or startup command)')
      return
    }

    console.log('[TabbySpaces] Command matched, waiting for shell output...:', fullCommand)

    // Unified command sender - reduces duplication
    const sendCommand = () => {
      console.log('[TabbySpaces] Shell ready, sending command:', fullCommand)
      terminalTab.sendInput(fullCommand + '\r')
      this.clearProfileArgs(terminalTab)
      this.setTabTitle(terminalTab, pending.originalTitle)
    }

    // Wait for shell to emit first output (prompt), then send command
    if (terminalTab.session?.output$) {
      terminalTab.session.output$.pipe(
        first(),
        timeout(2000),  // Prevent infinite wait if shell doesn't emit
        catchError(() => of(null))  // Fallback on timeout/error
      ).subscribe(() => {
        // Small delay after prompt renders
        setTimeout(sendCommand, 100)
      })
    } else {
      console.log('[TabbySpaces] No session.output$, falling back to timeout')
      setTimeout(sendCommand, 500)
    }
  }

  private buildFullCommand(pending: PendingCommand): string | null {
    return pending.command || null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private clearProfileArgs(terminalTab: BaseTerminalTabComponent<any>): void {
    // Clear args from profile to prevent native splits from re-running startup command
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = (terminalTab as any).profile
    if (profile?.options?.args) {
      console.log('[TabbySpaces] Clearing profile args to prevent re-run on split')
      profile.options.args = []
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setTabTitle(terminalTab: BaseTerminalTabComponent<any>, title: string): void {
    terminalTab.setTitle(title)
    terminalTab.customTitle = title
  }
}
