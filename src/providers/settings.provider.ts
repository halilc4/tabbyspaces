import { Injectable } from '@angular/core'
import { SettingsTabProvider } from 'tabby-settings'
import { WorkspaceListComponent } from '../components/workspaceList.component'
import { CONFIG_KEY, DISPLAY_NAME, IS_DEV } from '../build-config'

@Injectable()
export class WorkspaceEditorSettingsProvider extends SettingsTabProvider {
  id = CONFIG_KEY
  icon = IS_DEV ? 'bolt' : 'th-large'
  title = DISPLAY_NAME

  getComponentType(): any {
    return WorkspaceListComponent
  }
}
