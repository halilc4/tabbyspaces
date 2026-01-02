import { Injectable } from '@angular/core'
import { ConfigProvider } from 'tabby-core'
import { CONFIG_KEY } from '../build-config'

@Injectable()
export class WorkspaceEditorConfigProvider extends ConfigProvider {
  defaults = {
    [CONFIG_KEY]: {
      workspaces: [],
    },
  }
}
