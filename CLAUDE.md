# TabbySpaces

Visual split-layout workspace editor for Tabby.

## Tech Stack

- **Framework**: Angular 15 (Tabby uses Angular 15)
- **Language**: TypeScript 4.9
- **Templates**: Pug (.pug)
- **Styles**: SCSS
- **Build**: Webpack 5

## Structure

```
src/
├── index.ts                 # NgModule entry point
├── models/                  # TypeScript interfaces
├── services/                # Business logic
├── providers/               # Tabby config/settings providers
└── components/              # Angular components (.ts, .pug, .scss)
```

## Build

```bash
npm install            # .npmrc has legacy-peer-deps=true
npm run build          # Production build → dist/
npm run build:dev      # Dev build → dist-dev/ (isolated package)
```

Debug: `Ctrl+Shift+I` in Tabby opens DevTools.

## Tabby Plugin Patterns

### package.json (required)
```json
{
  "keywords": ["tabby-plugin"],
  "main": "dist/index.js",
  "tabbyPlugin": {
    "name": "tabbyspaces",
    "displayName": "TabbySpaces",
    "description": "Workspaces for Tabby - Visual split-layout workspace editor"
  }
}
```

### Config Provider
```typescript
@Injectable()
export class MyConfigProvider extends ConfigProvider {
  defaults = { myPlugin: { setting: 'value' } }
}
```

### Settings Tab Provider
```typescript
@Injectable()
export class MySettingsProvider extends SettingsTabProvider {
  id = 'my-plugin'
  icon = 'cog'
  title = 'My Plugin'
  getComponentType() { return MySettingsComponent }
}
```

### Module Registration
```typescript
@NgModule({
  providers: [
    { provide: ConfigProvider, useClass: MyConfigProvider, multi: true },
    { provide: SettingsTabProvider, useClass: MySettingsProvider, multi: true },
  ],
})
export default class MyModule {}
```

## Data Model

- `Workspace` - Main object with name, icon, color, root split
- `WorkspaceSplit` - Recursive structure with orientation, ratios, children
- `WorkspacePane` - Leaf node with profileId, cwd, startupCommand, title

## Tabby Profile Generation

Plugin stores a simplified model in `config.store.tabbyspaces.workspaces` and auto-generates verbose Tabby `split-layout` profiles in `config.store.profiles`.

## Nushell Startup Commands

For Nushell, startup commands are passed as:
```typescript
options.args = ['-e', startupCommand]
```

## References

- tabby-workspace-manager: https://github.com/composer404/tabby-workspace-manager
- tabby-clippy: https://github.com/Eugeny/tabby-clippy
- Tabby docs: https://docs.tabby.sh/

## Installation

### Plugin folder locations
```
Windows:  %APPDATA%\tabby\plugins
macOS:    ~/Library/Application Support/tabby/plugins
Linux:    ~/.config/tabby/plugins
```

### Production install
```bash
cd <plugins-folder>
npm install tabby-tabbyspaces
```

## Development

### Dev install (once)
```bash
npm run build:dev
cd %APPDATA%\tabby\plugins
npm install "<path-to-repo>/dist-dev"
```

### Dev workflow (after install)
```bash
npm run build:dev   # npm creates symlink, no reinstall needed
# restart Tabby
```

npm auto-creates symlinks for local packages, so each build is immediately available.

### Dev vs Prod Isolation

| | Prod | Dev |
|---|---|---|
| Package | `tabby-tabbyspaces` | `tabby-tabbyspaces-dev` |
| Config | `config.store.tabbyspaces` | `config.store.tabbyspaces_dev` |
| Display | "TabbySpaces" | "TabbySpaces DEV" |

Both plugins can be installed simultaneously.

## Known Issues

### YAML escape sequences in config.yaml
If a base profile in Tabby config uses double-quoted strings with wrong escape sequences (e.g., `\t` instead of `\\t`), the plugin will copy the corrupted path.

```yaml
# WRONG - \t becomes TAB character
command: "C:\\Users\\...\\Program\ts\\nu\\bin\\nu.exe"

# CORRECT - unquoted string
command: C:\Users\...\Programs\nu\bin\nu.exe
```


