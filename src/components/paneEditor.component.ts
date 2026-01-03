import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core'
import { WorkspacePane, TabbyProfile } from '../models/workspace.model'

@Component({
  selector: 'pane-editor',
  template: require('./paneEditor.component.pug'),
  styles: [require('./paneEditor.component.scss')],
})
export class PaneEditorComponent implements OnInit {
  @Input() pane!: WorkspacePane
  @Input() profiles: TabbyProfile[] = []
  @Output() save = new EventEmitter<WorkspacePane>()
  @Output() cancel = new EventEmitter<void>()

  editedPane!: WorkspacePane

  ngOnInit(): void {
    this.editedPane = { ...this.pane }
  }

  onSave(): void {
    this.save.emit(this.editedPane)
  }

  onCancel(): void {
    this.cancel.emit()
  }

  getProfileName(profileId: string): string {
    const profile = this.profiles.find((p) => p.id === profileId)
    return profile?.name ?? 'Unknown'
  }
}
