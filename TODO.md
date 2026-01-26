# TODO

> **Note:** Please write all entries in English.

## To Do

### Layout Editing
- [ ] Polish design
- [ ] Find better way to display nested panes in editor

### UX Improvements
- [ ] Split/Add pane: duplicate existing pane instead of creating empty one
- [ ] List: add small layout preview
- [ ] Better input for command
- [ ] Better input for cwd
- [ ] Editor workspace + pane editor autosave
- [ ] Undo/redo for editor changes

### Bugs
- [~] Resize panes in Tabby reverts to original values (ratio problem) - WATCH: happens only on one workspace
- [ ] Layout preview responsive - nested splits don't adapt well to smaller sizes
- [ ] Launch on startup - Tabby remembers open tabs, check if we can detect if workspace is already open; if not, kill the feature
- [x] Tab titles are a mess - keep only workspace name or default to Tabby behavior (verify no caching/lookup by tab name)

### Other
- [ ] Update screenshots in README

## Roadmap

- [ ] Pane presets (saved pane configurations for quick adding)
- [ ] Resize panes (adjust ratios in editor)
- [ ] Drag and drop panes (reorganize layout by dragging)

---

## Done

### Layout Editing
- [x] Remove two layout vert/hor buttons from toolbar (and horizontal/vertical text from list)
- [x] Enable selection in toolbar, add button for edit pane (not on click)
- [x] When item selected in toolbar - show options similar to context menu
- [x] Context menu for pane: add to left/right/top/bottom alongside split options + edit pane
- [x] Instead of "click to edit" - edit icon in pane corner
- [x] Title bug - better handling
- [x] Edit icon on pane: show on hover instead of on selection

### UX Improvements
- [x] Pane title format: `(Title - )? Base Profile` (show base profile if no custom title)
- [x] Move run button to workspace list
- [x] Launch on startup: switch from single workspace option to multi-select (multiple workspaces can be marked)
- [x] Not-saved / "you have changes" indicator (compare state after change with saved)
- [x] New workspace: focus on name input, no default value, placeholder "Name your workspace"
- [x] Save button: disabled when no changes, enabled when there are (replacement for indicator)
- [x] Duplicate: select new workspace after duplicating
- [x] Open/Run/Duplicate/Delete buttons select workspace - add stopPropagation
- [x] Rename "Run" to "Open" with appropriate icon

### Other
- [x] Different icon for DEV version (easier distinction in Settings)
- [x] Open workspace from workspace editor
- [x] Move workspace edit dialog inline above workspace list (always one selected)
- [x] Icon picker as dropdown next to color picker (similar UI)
- [x] Randomize color and icon on new workspace + focus on name input
- [x] Refactoring: Remove profile persistence, shell-aware CWD, dead code cleanup

### Bugs
- [x] Focus lost after deleting workspace (native confirm() steals focus from Electron) - fix: use NgbModal instead
- [x] Audit async functions - check if `detectChanges()` is missing after async operations that change state
- [x] Split pane runs command (in-memory profiles) - fix: clear profile.options.args after command execution
- [x] Pane editor modal bug - mouseup outside dialog closes modal. Dialog should close only on Esc or close/cancel/save button
- [x] Migration and profile deletion not working (fix: timing - cleanup was called before config.store loaded)
- [x] New workspace: focus on name input not working
- [x] Built-in shells (PowerShell, cmd, WSL) weren't working - filter looked for `type === 'local'` instead of `type.startsWith('local:')`
- [x] Fallback for built-in profile lookup (cache all profiles before opening workspace)

### Notes
- **CWD**: Uses native `options.cwd` in recovery token - shell spawns directly in target directory without visible `cd` commands.
