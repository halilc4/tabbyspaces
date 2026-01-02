import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { WorkspaceListComponent } from '../components/workspaceList.component'

@Injectable()
export class WorkspaceEditorSettingsProvider extends SettingsTabProvider {
  id = 'workspace-editor'
  icon = 'columns'
  title = 'Workspace Editor'

  getComponentType(): any {
    return WorkspaceListComponent
  }
}
