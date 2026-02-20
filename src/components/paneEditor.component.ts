import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core'
import { WorkspacePane, TabbyProfile } from '../models/workspace.model'

@Component({
  selector: 'pane-editor',
  template: require('./paneEditor.component.pug'),
  styles: [require('./paneEditor.component.scss')],
})
export class PaneEditorComponent {
  @Input() pane!: WorkspacePane
  @Input() profiles: TabbyProfile[] = []
  @Output() close = new EventEmitter<void>()

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close.emit()
  }

  get localProfiles(): TabbyProfile[] {
    return this.profiles.filter((p) => p.type === 'local' || p.type?.startsWith('local:'))
  }

  get sshProfiles(): TabbyProfile[] {
    return this.profiles.filter((p) => p.type === 'ssh')
  }

  get otherProfiles(): TabbyProfile[] {
    return this.profiles.filter((p) =>
      p.type !== 'local' && !p.type?.startsWith('local:') && p.type !== 'ssh'
    )
  }

  getProfileName(profileId: string): string {
    const profile = this.profiles.find((p) => p.id === profileId)
    return profile?.name ?? 'Unknown'
  }
}
