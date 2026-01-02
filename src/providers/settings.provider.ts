import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { WorkspaceListComponent } from '../components/workspaceList.component'

@Injectable()
export class WorkspaceEditorSettingsProvider extends SettingsTabProvider {
  id = 'tabbyspaces'
  icon = 'columns'
  title = 'TabbySpaces'

  getComponentType(): any {
    return WorkspaceListComponent
  }
}
