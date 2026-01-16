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
├── build-config.ts          # Build-time constants (CONFIG_KEY, DISPLAY_NAME)
├── models/                  # TypeScript interfaces
│   └── workspace.model.ts
├── services/                # Business logic
│   ├── workspaceEditor.service.ts
│   └── startupCommand.service.ts
├── providers/               # Tabby config/settings/toolbar providers
│   ├── config.provider.ts
│   ├── settings.provider.ts
│   └── toolbar.provider.ts
├── styles/                  # Shared SCSS (modular DRY)
│   ├── _variables.scss      # Spacing, radius, colors, z-index
│   └── _mixins.scss         # Reusable patterns
└── components/              # Angular components (.ts, .pug, .scss)
    ├── workspaceList        # Main settings UI
    ├── workspaceEditor      # Single workspace editor
    ├── paneEditor           # Pane configuration
    └── splitPreview         # Visual split preview
```

## Styles

Modular DRY SCSS architecture. All components import `@import '../styles/index'`.

- **Variables**: `$spacing-*`, `$radius-*`, `$color-*`, `$z-*`, `$transition-*`
- **Mixins**: `flex-row`, `form-input`, `interactive-card`, `toolbar-btn`, `btn-success`, etc.
- **Theming**: Uses Tabby's `--theme-*` CSS variables

See `docs/DESIGN.md` for details.

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
  "keywords": ["tabby", "tabby-plugin"],
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

- `Workspace` - Main object with name, icon, color, root split, launchOnStartup
- `WorkspaceSplit` - Recursive structure with orientation, ratios, children
- `WorkspacePane` - Leaf node with profileId (reference to existing Tabby profile), cwd, startupCommand, title

### Workspace Fields
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `name` | string | Display name |
| `icon` | string | FontAwesome icon name (without fa- prefix) |
| `color` | string | Hex color |
| `root` | WorkspaceSplit | Root split node |
| `launchOnStartup` | boolean | Auto-open when Tabby starts (multiple allowed) |

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

### Launch on Startup
Workspaces with `launchOnStartup: true` are automatically opened when Tabby starts. Multiple workspaces can be marked. Logic is in `toolbar.provider.ts` constructor with 500ms delay to ensure Tabby is ready.

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
| Toolbar icon | Grid (4 squares) | ⚡ Bolt |
| Settings icon | `th-large` | `bolt` |

Both plugins can be installed simultaneously.

## CDP Debugging (via tabby-mcp)

Automatizovan način za testiranje plugina kroz Chrome DevTools Protocol.

### Workflow
1. **Pokreni Tabby** sa remote debugging:
   ```bash
   cmd.exe /c start "" "C:\Program Files (x86)\Tabby\Tabby.exe" --remote-debugging-port=9222
   ```
2. **Izlistaj targets** sa `mcp__tabby__list_targets`
3. **Identifikuj target** - oba imaju isti URL, ali:
   - Target 0 = Tvoj radni Tabby (Claude Code session)
   - Target 1 = Debug Tabby instance (pokrenut sa --remote-debugging-port)
4. **Debug** sa `query`, `execute_js`, `screenshot`

**VAŽNO:** Debug-uj NOVI Tabby instance (target 1), ne onaj u kojem radiš!

### MCP Tools
| Tool | Opis |
|------|------|
| `mcp__tabby__list_targets` | Lista CDP targets sa index, title, URL, WebSocket |
| `mcp__tabby__query` | CSS selector → lista elemenata |
| `mcp__tabby__execute_js` | Izvrši JS (fresh scope, async/await support) |
| `mcp__tabby__screenshot` | Screenshot Tabby prozora |

### Identifikacija DEV verzije

DEV verzija ima ⚡ bolt ikonicu (umesto grid-a):
- **Toolbar**: SVG bolt ikonica u gornjem desnom uglu
- **Settings sidebar**: FontAwesome `fa-bolt` pored "TabbySpaces DEV"

```javascript
// Proveri da li je DEV verzija aktivna u settings
document.querySelector('.nav-link .fa-bolt')  // DEV
document.querySelector('.nav-link .fa-th-large')  // PROD
```

### CSS Selektori Reference

| Selektor | Element |
|----------|---------|
| `.preview-pane` | Pane u split preview-u |
| `.preview-pane.selected` | Selektovan pane |
| `.toolbar-btn` | Toolbar dugmad |
| `.toolbar-btn[title="Edit pane"]` | Specifično dugme po title-u |
| `.pane-editor-modal` | Edit pane modal |
| `.context-menu` | Context menu (desni klik) |
| `.workspace-item` | Workspace u listi |
| `.nav-link .fa-bolt` | DEV settings tab ikonica |
| `.nav-link .fa-th-large` | PROD settings tab ikonica |

### Primeri
```javascript
// Query elemente
mcp__tabby__query(target: 1, selector: '.preview-pane')

// Klikni na pane i proveri toolbar
document.querySelectorAll('.preview-pane')[0].click();
return Array.from(document.querySelectorAll('.toolbar-btn'))
  .map(b => ({title: b.title, disabled: b.disabled}));

// Split pane i vrati novi count
const before = document.querySelectorAll('.preview-pane').length;
document.querySelectorAll('.preview-pane')[0].click();
document.querySelector('.toolbar-btn[title="Split Horizontal"]').click();
return { before, after: document.querySelectorAll('.preview-pane').length };

// Async primer - sačekaj Angular change detection
document.querySelectorAll('.preview-pane')[0].click();
await new Promise(r => setTimeout(r, 100));
return document.querySelectorAll('.preview-pane.selected').length;
```

## Angular Change Detection

**KRITIČNO**: NE koristi `OnPush` strategiju na komponentama koje primaju mutirane objekte.

### Pravilo
- **NE koristi `OnPush`** ako parent komponenta mutira objekte umesto da kreira nove reference
- Angular default strategija automatski detektuje sve promene
- `OnPush` je samo za leaf komponente koje emituju events bez lokalnog state-a

### Zašto
- `OnPush` osvežava view samo kada se `@Input` referenca promeni
- Mutacija objekta (npr. `workspace.root.children.push()`) NE menja referencu
- Bez nove reference, Angular ne zna da treba re-renderovati

### Komponente u ovom projektu
- `workspaceEditor` - **default CD** (mutira workspace)
- `workspaceList` - **default CD** (koristi `detectChanges()` za async operacije)
- `splitPreview` - **default CD** (prima mutirane objekte)
- `paneEditor` - može biti `OnPush` (samo emituje, nema mutacija)

## Known Issues

### YAML escape sequences in config.yaml
If a base profile in Tabby config uses double-quoted strings with wrong escape sequences (e.g., `\t` instead of `\\t`), shell detection will fail and CWD commands may not work correctly.

```yaml
# WRONG - \t becomes TAB character
command: "C:\\Users\\...\\Program\ts\\nu\\bin\\nu.exe"

# CORRECT - unquoted string
command: C:\Users\...\Programs\nu\bin\nu.exe
```


