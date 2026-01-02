# Tabby Workspace Editor

Tabby plugin za vizuelno editovanje split-layout workspace profila.

## Tech Stack

- **Framework**: Angular 15 (Tabby koristi Angular 15)
- **Language**: TypeScript 4.9
- **Templates**: Pug (.pug)
- **Styles**: SCSS
- **Build**: Webpack 5

## Struktura

```
src/
├── index.ts                 # NgModule entry point
├── models/                  # TypeScript interfaces
├── services/                # Business logic
├── providers/               # Tabby config/settings providers
└── components/              # Angular components (.ts, .pug, .scss)
```

## Build & Test

```bash
npm install            # .npmrc ima legacy-peer-deps=true
npm run build          # Production build
npm run dev            # Watch mode
```

### Lokalno testiranje

Plugin mora biti u `%APPDATA%\tabby\plugins\node_modules\`. Koristi junction link:

```cmd
mklink /J "%APPDATA%\tabby\plugins\node_modules\tabby-workspace-editor" "C:\Users\halil\tabby-workspace-editor"
```

Posle builda restartuj Tabby. Za debug: `tabby --debug`

## Tabby Plugin Patterns

### package.json (obavezno)
```json
{
  "keywords": ["tabby-plugin"],
  "main": "dist/index.js",
  "tabbyPlugin": {
    "name": "tabby-workspace-editor",
    "displayName": "Workspace Editor",
    "description": "Visual editor for split-layout workspace profiles"
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

- `Workspace` - Glavni objekat sa name, icon, color, root split
- `WorkspaceSplit` - Rekurzivna struktura sa orientation, ratios, children
- `WorkspacePane` - Leaf node sa profileId, cwd, startupCommand, title

## Konverzija u Tabby Format

Plugin čuva pojednostavljeni model u `config.store.workspaceEditor.workspaces` i automatski generiše verbose Tabby `split-layout` profile u `config.store.profiles`.

## Nushell Startup Commands

Za Nushell, startup komande se prosleđuju kao:
```typescript
options.args = ['-e', startupCommand]
```

## Reference

- tabby-workspace-manager: https://github.com/composer404/tabby-workspace-manager
- tabby-clippy: https://github.com/Eugeny/tabby-clippy
- Tabby docs: https://docs.tabby.sh/

## Poznati Problemi

### YAML escape sekvence u config.yaml
Ako bazni profil u Tabby config-u koristi double-quoted string sa pogrešnim escape sekvencama (npr. `\t` umesto `\\t`), plugin će kopirati oštećenu putanju. Primer problema:
```yaml
# POGREŠNO - \t postaje TAB karakter
command: "C:\\Users\\...\\Program\ts\\nu\\bin\\nu.exe"

# ISPRAVNO - unquoted string
command: C:\Users\...\Programs\nu\bin\nu.exe
```
