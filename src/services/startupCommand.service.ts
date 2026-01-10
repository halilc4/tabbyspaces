import { Injectable } from '@angular/core'
import { AppService, BaseTabComponent, SplitTabComponent } from 'tabby-core'
import { BaseTerminalTabComponent } from 'tabby-terminal'
import { Subscription, first, timer, switchMap } from 'rxjs'

export interface PendingCommand {
  paneId: string
  command?: string
  originalTitle: string
}

@Injectable()
export class StartupCommandService {
  private pendingCommands: Map<string, PendingCommand> = new Map()
  private subscription: Subscription

  constructor(private app: AppService) {
    this.subscription = this.app.tabOpened$.subscribe((tab) => this.onTabOpened(tab))
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

    // Wait for shell to emit first output (prompt), then send command
    if (terminalTab.session?.output$) {
      terminalTab.session.output$.pipe(
        first(),                      // Wait for first output (shell prompt)
        switchMap(() => timer(100))   // Small buffer after prompt renders
      ).subscribe(() => {
        console.log('[TabbySpaces] Shell ready, sending command:', fullCommand)
        terminalTab.sendInput(fullCommand + '\r')

        // Reset title - either to original or clear for dynamic shell title
        if (pending.originalTitle) {
          terminalTab.setTitle(pending.originalTitle)
        } else {
          terminalTab.customTitle = ''
        }
      })
    } else {
      console.log('[TabbySpaces] No session.output$, falling back to timeout')
      // Fallback if session not available yet
      setTimeout(() => {
        terminalTab.sendInput(fullCommand + '\r')
        if (pending.originalTitle) {
          terminalTab.setTitle(pending.originalTitle)
        } else {
          terminalTab.customTitle = ''
        }
      }, 500)
    }
  }

  private buildFullCommand(pending: PendingCommand): string | null {
    return pending.command || null
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe()
  }
}
