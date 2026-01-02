import { Injectable } from '@angular/core'
import { ConfigProvider } from 'tabby-core'

@Injectable()
export class WorkspaceEditorConfigProvider extends ConfigProvider {
  defaults = {
    tabbyspaces: {
      workspaces: [],
    },
  }
}
