# Changelog

## [0.1.0] - 2026-01-13

### Features

- Inline workspace editor (replaces modal dialog)
- Layout editing toolbar with pane selection system
- Startup command support per pane
- Launch on startup supports multiple workspaces
- Distinct icons for DEV vs PROD versions

### Bug Fixes

- Fix delete/save race conditions with async/await
- Fix native split re-running startup command
- Fix async change detection and profile cleanup timing

### UX Improvements

- Pane title format: shows base profile when no custom title
- Toolbar UI polish
- Settings panel max-width override (1024px)

### Technical

- Remove profile persistence (cleaner architecture - no generated profiles)
- Watch mode for dev workflow (`npm run watch:dev`)

---

## [0.0.1] - 2026-01-03

Initial release.

### Features

- Workspace list with create, edit, duplicate, delete
- Visual split-layout editor (horizontal/vertical, any nesting depth)
- Pane configuration: base profile, working directory, startup command, custom title
- Toolbar button for quick workspace launch
- Icon and color customization per workspace

### Technical

- Full dev/prod build isolation for parallel development
