# Layout Editing Refactor Plan

## Overview
Kompletan refaktor layout editing UX-a u TabbySpaces workspace editoru.

## Fajlovi za izmenu

| Fajl | Izmene |
|------|--------|
| `src/components/workspaceEditor.component.ts` | Selekcija, toolbar akcije, Add logika |
| `src/components/workspaceEditor.component.pug` | Novi toolbar, ukloniti H/V dugmad |
| `src/components/workspaceEditor.component.scss` | Toolbar styling, full-width layout |
| `src/components/splitPreview.component.ts` | Selekcija umesto edit, nove Add opcije |
| `src/components/splitPreview.component.pug` | Pane info prikaz, context menu, edit ikonica |
| `src/components/splitPreview.component.scss` | Selekcija vizual, kontrast, border |

---

## Implementacija

### 1. Selekcija pane-a

**splitPreview.component.ts:**
```typescript
@Input() selectedPaneId: string | null = null
@Output() paneSelect = new EventEmitter<WorkspacePane>()

onPaneClick(pane: WorkspacePane): void {
  this.paneSelect.emit(pane)  // Samo selektuj, ne otvara edit
}
```

**workspaceEditor.component.ts:**
```typescript
selectedPaneId: string | null = null

selectPane(pane: WorkspacePane): void {
  this.selectedPaneId = pane.id
}

deselectPane(): void {
  this.selectedPaneId = null
}

// Klik van pane-ova
onPreviewBackgroundClick(): void {
  this.deselectPane()
}
```

---

### 2. Toolbar

**workspaceEditor.component.pug:**
```pug
.layout-toolbar
  .toolbar-group
    button.toolbar-btn(
      [disabled]='!selectedPaneId'
      (click)='editSelectedPane()'
      title='Edit pane'
    )
      i.fas.fa-pen

  .toolbar-divider

  .toolbar-group.split-group
    button.toolbar-btn(
      [disabled]='!selectedPaneId'
      (click)='splitSelectedPane("horizontal")'
      title='Split Horizontal'
    )
      i.fas.fa-arrows-alt-h
    button.toolbar-btn(
      [disabled]='!selectedPaneId'
      (click)='splitSelectedPane("vertical")'
      title='Split Vertical'
    )
      i.fas.fa-arrows-alt-v

  .toolbar-divider

  .toolbar-group.add-group
    button.toolbar-btn(
      [disabled]='!selectedPaneId'
      (click)='addPane("left")'
      title='Add Left'
    )
      i.fas.fa-caret-left
    button.toolbar-btn(
      [disabled]='!selectedPaneId'
      (click)='addPane("right")'
      title='Add Right'
    )
      i.fas.fa-caret-right
    button.toolbar-btn(
      [disabled]='!selectedPaneId'
      (click)='addPane("top")'
      title='Add Top'
    )
      i.fas.fa-caret-up
    button.toolbar-btn(
      [disabled]='!selectedPaneId'
      (click)='addPane("bottom")'
      title='Add Bottom'
    )
      i.fas.fa-caret-down

  .toolbar-divider

  .toolbar-group
    button.toolbar-btn.danger(
      [disabled]='!selectedPaneId || !canRemovePane()'
      (click)='removeSelectedPane()'
      title='Remove pane'
    )
      i.fas.fa-trash
```

**Ukloniti** stari `.orientation-toggle` iz `.layout-header`.

---

### 3. Add operacija

**workspaceEditor.component.ts:**
```typescript
addPane(direction: 'left' | 'right' | 'top' | 'bottom'): void {
  if (!this.selectedPaneId) return
  const pane = this.findPaneById(this.selectedPaneId)
  if (!pane) return

  this.addPaneInTree(this.workspace.root, pane, direction)
}

private addPaneInTree(
  node: WorkspaceSplit,
  targetPane: WorkspacePane,
  direction: 'left' | 'right' | 'top' | 'bottom'
): boolean {
  const isHorizontalAdd = direction === 'left' || direction === 'right'
  const isBefore = direction === 'left' || direction === 'top'

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]

    if (isWorkspaceSplit(child)) {
      if (this.addPaneInTree(child, targetPane, direction)) return true
    } else if (child.id === targetPane.id) {
      const newPane = createDefaultPane()
      newPane.profileId = child.profileId

      // Ista orijentacija kao parent?
      const sameOrientation =
        (node.orientation === 'horizontal' && isHorizontalAdd) ||
        (node.orientation === 'vertical' && !isHorizontalAdd)

      if (sameOrientation) {
        // Dodaj kao sibling
        const insertIndex = isBefore ? i : i + 1
        node.children.splice(insertIndex, 0, newPane)
        this.recalculateRatios(node)
      } else {
        // Wrap ceo parent u novi split
        const newOrientation = isHorizontalAdd ? 'horizontal' : 'vertical'
        const wrapper: WorkspaceSplit = {
          orientation: newOrientation,
          ratios: [0.5, 0.5],
          children: isBefore
            ? [newPane, ...node.children]
            : [...node.children, newPane]
        }
        // Zameni root ako je node root
        if (node === this.workspace.root) {
          this.workspace.root = wrapper
        } else {
          // Nađi parent i zameni node sa wrapper
          this.replaceNodeInTree(this.workspace.root, node, wrapper)
        }
      }
      return true
    }
  }
  return false
}

private replaceNodeInTree(
  parent: WorkspaceSplit,
  target: WorkspaceSplit,
  replacement: WorkspaceSplit
): boolean {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i]
    if (child === target) {
      parent.children[i] = replacement
      return true
    }
    if (isWorkspaceSplit(child)) {
      if (this.replaceNodeInTree(child, target, replacement)) return true
    }
  }
  return false
}
```

---

### 4. Pane info prikaz

**splitPreview.component.pug:**
```pug
.preview-pane(
  [class.selected]='pane.id === selectedPaneId'
  (click)='onPaneClick(pane)'
  (contextmenu)='onContextMenu($event, pane)'
)
  .pane-content
    .pane-title(*ngIf='pane.title')
      | {{ pane.title }}
    .pane-profile(*ngIf='!pane.title')
      | {{ getProfileName(pane.profileId) }}
    .pane-details
      .pane-detail(*ngIf='pane.cwd' [title]='pane.cwd')
        i.fas.fa-folder
        span {{ truncate(pane.cwd, 20) }}
      .pane-detail(*ngIf='pane.startupCommand' [title]='pane.startupCommand')
        i.fas.fa-terminal
        span {{ truncate(pane.startupCommand, 20) }}

  button.pane-edit-btn(
    *ngIf='pane.id === selectedPaneId'
    (click)='onEditClick($event, pane)'
    title='Edit pane'
  )
    i.fas.fa-pen
```

**splitPreview.component.ts:**
```typescript
truncate(text: string, maxLength: number): string {
  return text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text
}

onEditClick(event: MouseEvent, pane: WorkspacePane): void {
  event.stopPropagation()  // Ne triggeruj selekciju
  this.paneEdit.emit(pane)
}
```

---

### 5. Context menu

**splitPreview.component.pug:**
```pug
.context-menu
  button((click)='onEdit()')
    i.fas.fa-pen
    span Edit
  .context-menu-divider
  button((click)='onSplitH()')
    i.fas.fa-arrows-alt-h
    span Split Horizontal
  button((click)='onSplitV()')
    i.fas.fa-arrows-alt-v
    span Split Vertical
  .context-menu-divider
  button((click)='onAddLeft()')
    i.fas.fa-caret-left
    span Add Left
  button((click)='onAddRight()')
    i.fas.fa-caret-right
    span Add Right
  button((click)='onAddTop()')
    i.fas.fa-caret-up
    span Add Top
  button((click)='onAddBottom()')
    i.fas.fa-caret-down
    span Add Bottom
  .context-menu-divider
  button.danger((click)='onRemove()' [disabled]='!canRemove')
    i.fas.fa-trash
    span Remove
```

**Novi eventi:**
```typescript
@Output() addLeft = new EventEmitter<WorkspacePane>()
@Output() addRight = new EventEmitter<WorkspacePane>()
@Output() addTop = new EventEmitter<WorkspacePane>()
@Output() addBottom = new EventEmitter<WorkspacePane>()
@Output() paneEdit = new EventEmitter<WorkspacePane>()
```

---

### 6. Styling

**splitPreview.component.scss:**
```scss
.split-preview {
  background: var(--theme-bg);  // Wrapper tamniji
}

.preview-pane {
  background: var(--theme-bg-more);
  border: 2px solid transparent;  // Anti-flicker
  position: relative;

  &.selected {
    border-color: var(--theme-primary);
  }

  &:hover {
    background: var(--theme-bg-more-more);
  }
}

.pane-edit-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  // ... styling
}

.pane-details {
  font-size: 0.75em;
  opacity: 0.7;

  .pane-detail {
    display: flex;
    align-items: center;
    gap: 4px;

    i { width: 12px; }
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
```

**workspaceEditor.component.scss:**
```scss
.layout-preview-container {
  width: 100%;  // Full width
}

.layout-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;

  .toolbar-group {
    display: flex;
    gap: 2px;
  }

  .toolbar-divider {
    width: 1px;
    height: 20px;
    background: var(--theme-border);
    margin: 0 4px;
  }

  .toolbar-btn {
    padding: 4px 8px;
    background: var(--theme-bg-more);
    border: 1px solid var(--theme-border);
    border-radius: 4px;
    color: var(--theme-fg);
    cursor: pointer;

    &:hover:not(:disabled) {
      background: var(--theme-bg-more-more);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &.danger {
      color: var(--theme-danger);
    }
  }
}
```

---

## Ograničenja

- **Remove disabled** kad je samo 1 pane:
```typescript
canRemovePane(): boolean {
  return this.countPanes(this.workspace.root) > 1
}

private countPanes(node: WorkspaceSplit): number {
  return node.children.reduce((count, child) => {
    return count + (isWorkspaceSplit(child)
      ? this.countPanes(child)
      : 1)
  }, 0)
}
```

---

## Verifikacija

### Build
```bash
npm run build:dev
```

### Manual testing (Tabby)
1. Otvoriti TabbySpaces settings tab
2. Kreirati novi workspace ili selektovati postojeći
3. Testirati:
   - [ ] Klik na pane selektuje (border + ikonica)
   - [ ] Klik van pane-ova deselektuje
   - [ ] Toolbar disabled kad ništa nije selektovano
   - [ ] Edit dugme otvara modal
   - [ ] Split H/V kreira nested strukturu
   - [ ] Add L/R dodaje sibling (ista orijentacija)
   - [ ] Add T/B wrappuje parent (cross-orijentacija)
   - [ ] Remove briše pane (disabled kad je 1)
   - [ ] Context menu ima sve opcije
   - [ ] Pane prikazuje title/profile/cwd/command
   - [ ] Truncate + tooltip radi

### CDP debugging
```bash
cmd.exe /c start "" "C:\Program Files (x86)\Tabby\Tabby.exe" --remote-debugging-port=9222
```
Koristiti `mcp__tabby__query` i `mcp__tabby__execute_js` za automatizovano testiranje.

---

## Redosled implementacije

1. **Selekcija** - osnova za sve ostalo
2. **Toolbar** - UI za akcije
3. **Split refactor** - razdvojiti od starog click-to-edit
4. **Add operacija** - nova logika
5. **Pane info** - bolji prikaz
6. **Context menu** - update sa novim opcijama
7. **Styling** - kontrast, border, full-width
8. **Edge cases** - remove disabled, tooltip
