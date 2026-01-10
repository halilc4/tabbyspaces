# TabbySpaces

Visual split-layout workspace editor for Tabby.

## Git Workflow

- **main** - Stable releases only. Do not commit directly.
- **dev** - Active development. All work happens here.

```bash
# Normal workflow
git checkout dev        # Work on dev
# ... make changes ...
git commit

# Release workflow
git checkout main
git merge dev
git tag v0.x.0
git push --tags
git checkout dev        # Back to work
```

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
npm run watch:dev      # Watch mode for dev build
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
- `WorkspacePane` - Leaf node with profileId (reference to existing Tabby profile), cwd, startupCommand, title

## Architecture

### Storage
Plugin stores workspaces in `config.store.tabbyspaces.workspaces`. No profiles are generated in `config.store.profiles`.

### Opening Workspaces
1. Generate temporary `split-layout` recovery token from workspace model (includes `options.cwd`)
2. Open via `ProfilesService.openNewTabForProfile()`
3. `StartupCommandService` listens for `tabOpened$` events
4. Match terminal tabs by pane ID (passed via `tabCustomTitle`)
5. Send startup command via `sendInput()` (if defined)

### CWD Handling
CWD is set via native `options.cwd` in the recovery token. The shell spawns directly in the target directory - no visible `cd` commands.

### Profile Support
Plugin supports both user-defined profiles (`type: 'local'`) and built-in shells (`type: 'local:cmd'`, `'local:powershell'`, `'local:wsl'`, etc.). Profile lookup uses a two-stage approach:
1. First checks user profiles in `config.store.profiles`
2. Falls back to cached profiles from `profilesService.getProfiles()` (includes built-ins)

### Migration
`cleanupOrphanedProfiles()` removes any leftover profiles from previous plugin versions (prefix `split-layout:tabbyspaces:`).

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
# Via Tabby Plugin Manager (Settings → Plugins → search "tabbyspaces")
# Or via npm:
cd <plugins-folder>
npm install tabby-tabbyspaces
```

### Production uninstall
```bash
# Via Tabby Plugin Manager
# Or via npm:
cd <plugins-folder>
npm uninstall tabby-tabbyspaces
```

## Development

### Dev install (once)
```bash
npm run build:dev
cd %APPDATA%\tabby\plugins
npm install "<path-to-repo>/dist-dev"
# Restart Tabby
```

### Dev uninstall
```bash
cd %APPDATA%\tabby\plugins
npm uninstall tabby-tabbyspaces-dev
# Restart Tabby
```

### Dev workflow (after install)
```bash
npm run build:dev   # Rebuild
npm run watch:dev   # Watch mode - rebuilds on file changes
# Restart Tabby after each rebuild
```

npm creates symlinks for local packages, so each build is immediately available.

### Dev vs Prod Isolation

| | Prod | Dev |
|---|---|---|
| Package | `tabby-tabbyspaces` | `tabby-tabbyspaces-dev` |
| Config | `config.store.tabbyspaces` | `config.store.tabbyspaces_dev` |
| Display | "TabbySpaces" | "TabbySpaces DEV" |

Both plugins can be installed simultaneously.

## CDP Debugging (via tabby-mcp)

Automatizovan način za testiranje plugina kroz Chrome DevTools Protocol.

### Workflow
1. **Pokreni Tabby** sa remote debugging:
   ```bash
   cmd.exe /c start "" "C:\Program Files (x86)\Tabby\Tabby.exe" --remote-debugging-port=9222
   ```
2. **Izlistaj targets** sa `mcp__tabby__list_targets`
3. **Koristi poslednji target** (index -1 ili najveći index) - to je glavni Tabby prozor
4. **Debug** sa `query` i `execute_js`

**VAŽNO:** Debug-uj NOVI Tabby instance, ne onaj u kojem radiš!

### MCP Tools
| Tool | Opis |
|------|------|
| `mcp__tabby__list_targets` | Lista CDP targets (tabs) sa URL i WebSocket |
| `mcp__tabby__query` | CSS selector → lista elemenata |
| `mcp__tabby__execute_js` | Izvrši JS u Tabby kontekstu |

### Primeri
```javascript
// Query elemente
mcp__tabby__query(target: -1, selector: '.list-group-item')

// Klikni na element po indexu
document.querySelectorAll('.list-group-item')[5].click()

// Dobij sve linkove
Array.from(document.querySelectorAll('a')).map(a => a.innerText)

// Proveri body content
document.body.innerText
```

## Known Issues

### YAML escape sequences in config.yaml
If a base profile in Tabby config uses double-quoted strings with wrong escape sequences (e.g., `\t` instead of `\\t`), shell detection will fail and CWD commands may not work correctly.

```yaml
# WRONG - \t becomes TAB character
command: "C:\\Users\\...\\Program\ts\\nu\\bin\\nu.exe"

# CORRECT - unquoted string
command: C:\Users\...\Programs\nu\bin\nu.exe
```


