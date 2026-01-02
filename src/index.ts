import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ConfigProvider, ToolbarButtonProvider } from 'tabby-core'
import { SettingsTabProvider } from 'tabby-settings'

import { WorkspaceEditorConfigProvider } from './providers/config.provider'
import { WorkspaceEditorSettingsProvider } from './providers/settings.provider'
import { WorkspaceToolbarProvider } from './providers/toolbar.provider'
import { WorkspaceEditorService } from './services/workspaceEditor.service'

import { WorkspaceListComponent } from './components/workspaceList.component'
import { WorkspaceEditorComponent } from './components/workspaceEditor.component'
import { PaneEditorComponent } from './components/paneEditor.component'
import { SplitPreviewComponent } from './components/splitPreview.component'

@NgModule({
  imports: [CommonModule, FormsModule],
  providers: [
    { provide: ConfigProvider, useClass: WorkspaceEditorConfigProvider, multi: true },
    { provide: SettingsTabProvider, useClass: WorkspaceEditorSettingsProvider, multi: true },
    { provide: ToolbarButtonProvider, useClass: WorkspaceToolbarProvider, multi: true },
    WorkspaceEditorService,
  ],
  declarations: [
    WorkspaceListComponent,
    WorkspaceEditorComponent,
    PaneEditorComponent,
    SplitPreviewComponent,
  ],
})
export default class WorkspaceEditorModule {}

export {
  WorkspaceEditorService,
  WorkspaceEditorConfigProvider,
  WorkspaceEditorSettingsProvider,
}
