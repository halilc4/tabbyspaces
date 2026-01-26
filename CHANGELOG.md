# Changelog

## [0.2.0] - 2026-01-26

### Design

- **S1 "Tight & Sharp" UI redesign**
  - Tab bar navigation replaces vertical workspace list
  - Inline pane editor replaces modal overlay
  - Section-based layout with uppercase titles
  - Reorganized preview toolbar with icon buttons
  - 2-column form grid in pane editor
- Refactor SCSS to modular DRY architecture
  - Shared variables: spacing scale, border radius, colors, z-index
  - Reusable mixins: flex-row, form-input, interactive-card, toolbar-btn
  - All components migrated to use shared styles
- Add design system documentation (docs/DESIGN.md)
- Add HTML mockups for design exploration

### Reliability

- Improved duplicate workspace detection on Tabby restart
  - Add workspaceId to recovery tokens
  - Two-strategy detection (restored tabs + freshly opened)
- Better shell initialization with 2s timeout and error handling
- Wait for Tabby recovery before launching startup workspaces
- Type-safe workspace detection with proper type guards

### Bug Fixes

- Fix focus lost after workspace delete (NgbModal replaces native confirm)
- Fix split preview change detection (remove OnPush strategy)
- Fix race condition in shell initialization

### Infrastructure

- Add CI/CD workflows (GitHub Actions for build + release)
- Add dev branch workflow documentation

### Technical

- Code review cleanup and fixes
- Consistent use of deepClone helper
- Add deleteConfirmModal component
- Improve singleton service patterns

---

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
