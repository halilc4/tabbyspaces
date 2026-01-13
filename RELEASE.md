# Release Workflow

## Trenutno stanje
- **Dev branch**: 15 commit-a ispred main-a
- **Verzija**: 0.0.1
- **Tagovi**: Nema
- **PROD instalacija**: Lokalni symlink (za testiranje)
- **Status**: U toku testiranja (2026-01-13)

## Instalacije u Tabby plugins
```json
// %APPDATA%\tabby\plugins\package.json
{
  "dependencies": {
    "tabby-tabbyspaces": "file:../../../../tabbyspaces/dist",  // LOKALNI SYMLINK (za testiranje)
    "tabby-tabbyspaces-dev": "file:../../../../tabbyspaces/dist-dev"
  }
}
```

| Verzija | Config key | Ikonica | Update |
|---------|------------|---------|--------|
| PROD | `tabbyspaces` | Grid (`th-large`) | `npm run build` + restart |
| DEV | `tabbyspaces_dev` | Bolt (`bolt`) | `npm run build:dev` + restart |

## Testiranje (ručno)

### Funkcionalnosti za testirati
- [x] Plugin se pojavljuje u Settings sidebar (ikonica `th-large`, ne `bolt`)
- [x] Toolbar dugme (grid ikonica)
- [ ] Kreiranje novog workspace-a
- [ ] Split layout editing (horizontal/vertical)
- [ ] Pane selection i editing
- [ ] Startup command
- [ ] Launch on startup
- [ ] Čuvanje u `config.store.tabbyspaces`

### Install/Uninstall
- [x] Uninstall PROD (`npm uninstall tabby-tabbyspaces`)
- [x] Install lokalni symlink (`npm install dist`)
- [x] Reinstall sa npm registry (`npm install tabby-tabbyspaces`)

### Napomene iz testiranja
- Na prvi pogled funkcionalno radi
- (dodaj napomene tokom testiranja)

### Iterativno testiranje
```bash
# Napravi promenu → build → restart Tabby
npm run build
```

## Release (kad bude spremno)

```bash
# 1. Bump verziju u package.json (npr. "0.1.0")

# 2. Final build
npm run build

# 3. Commit
git add package.json
git commit -m "Bump version to 0.1.0"

# 4. Merge u main
git checkout main
git merge dev

# 5. Tag
git tag v0.1.0

# 6. Push
git push origin main
git push --tags

# 7. Publish na npm
cd dist
npm publish

# 8. Vrati se na dev
git checkout dev
```

## Posle testiranja (opciono)

Vrati PROD na npm registry verziju:
```bash
cd %APPDATA%\tabby\plugins
npm uninstall tabby-tabbyspaces
npm install tabby-tabbyspaces
```
