# Code Review - TabbySpaces

**Date**: 2026-01-15
**Reviewer**: Claude Opus 4.5
**Scope**: Full codebase review (TypeScript, SCSS, Angular patterns)

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | Open |
| 🟠 Moderate | 5 | Open |
| 🟡 Minor | 6 | Open |

---

## 🔴 Critical Issues

### CR-001: Memory Leak in StartupCommandService

**File**: `src/services/startupCommand.service.ts:17-18, 134-136`
**Priority**: P0 - Fix immediately

**Problem**: The service subscribes to `app.tabOpened$` in the constructor but `ngOnDestroy()` is never called because services are not Angular components with lifecycle hooks.

```typescript
export class StartupCommandService {
  private subscription: Subscription

  constructor(private app: AppService) {
    this.subscription = this.app.tabOpened$.subscribe(...)
  }

  ngOnDestroy(): void {  // NEVER CALLED - not an Angular lifecycle
    this.subscription?.unsubscribe()
  }
}
```

**Impact**: Subscription leaks for the entire application lifetime. Multiple subscriptions accumulate if service is re-provided.

**Fix**: Use `DestroyRef` with `takeUntilDestroyed()` (Angular 16+):
```typescript
constructor(private app: AppService, private destroyRef: DestroyRef) {
  this.app.tabOpened$.pipe(
    takeUntilDestroyed(this.destroyRef)
  ).subscribe((tab) => this.onTabOpened(tab))
}
```

---

### CR-002: Race Condition in Shell Initialization

**File**: `src/services/startupCommand.service.ts:88-116`
**Priority**: P0 - Fix immediately

**Problem**: Mixing RxJS subscriptions with `setTimeout` creates unpredictable race conditions.

```typescript
if (terminalTab.session?.output$) {
  terminalTab.session.output$.pipe(
    first(),
    switchMap(() => timer(100))
  ).subscribe(() => {
    terminalTab.sendInput(fullCommand + '\r')
  })
} else {
  setTimeout(() => {
    terminalTab.sendInput(fullCommand + '\r')
  }, 500)
}
```

**Impact**:
- Commands may not send if `output$` emits before subscription completes
- No error handling if session closes unexpectedly
- `switchMap` can cancel subscriptions on rapid tab opens

**Fix**: Consolidate async logic with proper error handling:
```typescript
const sendCommand = () => {
  terminalTab.sendInput(fullCommand + '\r')
  this.clearProfileArgs(terminalTab)
  terminalTab.setTitle(pending.originalTitle)
}

const waitForReady$ = terminalTab.session?.output$
  ? terminalTab.session.output$.pipe(first(), delay(100))
  : timer(500)

waitForReady$.subscribe({
  next: sendCommand,
  error: () => sendCommand()  // Fallback on error
})
```

---

### CR-003: Unsafe Type Casts in Duplicate Detection

**File**: `src/providers/toolbar.provider.ts:71, 79`
**Priority**: P0 - Fix immediately

**Problem**: Using `any` cast hides potential runtime errors.

```typescript
const token = (tab as any).recoveryToken  // UNSAFE CAST
if (child.profile?.id?.includes(`:${workspaceId}`))  // UNSAFE
```

**Impact**:
- If `recoveryToken` doesn't exist, code continues silently with `undefined`
- `.includes()` for ID matching is brittle (could match partial IDs)

**Fix**: Add proper type guards:
```typescript
interface TabWithRecoveryToken {
  recoveryToken?: { workspaceId?: string }
}

const getWorkspaceId = (tab: unknown): string | undefined => {
  if (tab && typeof tab === 'object' && 'recoveryToken' in tab) {
    return (tab as TabWithRecoveryToken).recoveryToken?.workspaceId
  }
  return undefined
}

// Use strict ID matching
const profileId = child.profile?.id ?? ''
if (profileId.startsWith(`split-layout:${CONFIG_KEY}:`) &&
    profileId.endsWith(`:${workspaceId}`)) {
  return true
}
```

---

## 🟠 Moderate Issues

### CR-004: DRY Violation - Tree Walking Logic

**File**: `src/components/workspaceEditor.component.ts`
**Priority**: P1 - Fix soon

**Problem**: Tree traversal logic is duplicated in 4+ methods:
- `splitPaneInTree()` (lines 194-229)
- `removePaneFromTree()` (lines 244-273)
- `updatePaneInTree()` (lines 179-192)
- `addPaneInTree()` (lines 316-366)

**Fix**: Extract generic tree walker utility:
```typescript
type TreeVisitor<T> = (
  child: WorkspaceSplit | WorkspacePane,
  index: number,
  parent: WorkspaceSplit
) => T | undefined

private walkTree<T>(
  node: WorkspaceSplit,
  visitor: TreeVisitor<T>
): T | undefined {
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    const result = visitor(child, i, node)
    if (result !== undefined) return result

    if (isWorkspaceSplit(child)) {
      const nested = this.walkTree(child, visitor)
      if (nested !== undefined) return nested
    }
  }
  return undefined
}
```

---

### CR-005: DRY Violation - Button Styles

**Files**:
- `src/components/workspaceList.component.scss:15-85`
- `src/components/workspaceEditor.component.scss:183-211`
- `src/components/paneEditor.component.scss:90-120`

**Priority**: P1 - Fix soon

**Problem**: Each component defines its own button styles instead of using shared mixins from `_mixins.scss`.

**Fix**: Use existing `@mixin toolbar-btn` consistently:
```scss
.btn-primary {
  @include toolbar-btn;
  @include btn-success;
}

.btn-ghost {
  @include toolbar-btn;
  background: transparent;
}

.btn-danger {
  @include toolbar-btn;
  color: var(--theme-danger);
}
```

---

### CR-006: Inconsistent Error Handling

**File**: `src/services/workspaceEditor.service.ts:34-40`
**Priority**: P1 - Fix soon

**Problem**: `saveWorkspaces()` returns boolean but callers don't check the result.

```typescript
async saveWorkspaces(workspaces: Workspace[]): Promise<boolean> {
  if (!this.config.store?.[CONFIG_KEY]) {
    return false  // Silent failure - callers don't check
  }
  // ...
}
```

**Impact**: `addWorkspace`, `updateWorkspace`, `deleteWorkspace` may silently fail.

**Fix**: Either throw exceptions or ensure all callers handle the boolean return value:
```typescript
async saveWorkspaces(workspaces: Workspace[]): Promise<void> {
  if (!this.config.store?.[CONFIG_KEY]) {
    throw new Error('Config store not initialized')
  }
  // ...
}
```

---

### CR-007: Missing Profile Cache Invalidation

**File**: `src/services/workspaceEditor.service.ts:26-28`
**Priority**: P1 - Fix soon

**Problem**: Profile cache is never invalidated if user adds/removes profiles during runtime.

```typescript
private async cacheProfiles(): Promise<void> {
  this.cachedProfiles = (await this.profilesService.getProfiles()) as TabbyProfile[]
}
```

**Fix**: Add cache invalidation or make cache time-limited:
```typescript
private cachedProfiles: TabbyProfile[] | null = null
private cacheTimestamp: number = 0
private readonly CACHE_TTL = 30000  // 30 seconds

private async getProfiles(): Promise<TabbyProfile[]> {
  const now = Date.now()
  if (!this.cachedProfiles || now - this.cacheTimestamp > this.CACHE_TTL) {
    this.cachedProfiles = await this.profilesService.getProfiles()
    this.cacheTimestamp = now
  }
  return this.cachedProfiles
}
```

---

### CR-008: Manual Change Detection Overuse

**File**: `src/components/workspaceList.component.ts`
**Priority**: P2 - Refactor when possible

**Problem**: Component calls `cdr.detectChanges()` in 5 different places instead of using proper change detection strategy.

**Fix**: Use `ChangeDetectionStrategy.OnPush` and rely on immutable data patterns:
```typescript
@Component({
  selector: 'workspace-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

---

## 🟡 Minor Issues

### CR-009: Missing JSDoc Documentation

**Files**:
- `src/models/workspace.model.ts` - Factory functions lack documentation
- `src/services/workspaceEditor.service.ts` - Public methods lack documentation

**Priority**: P2 - Improve when touching these files

**Fix**: Add JSDoc to all public APIs:
```typescript
/**
 * Creates a new workspace with default configuration.
 * @param name - Display name for the workspace
 * @returns A new Workspace instance with generated UUID
 */
export function createDefaultWorkspace(name?: string): Workspace {
  // ...
}
```

---

### CR-010: Magic Numbers and Strings

**Files**:
- `src/providers/toolbar.provider.ts:122` - `'__settings__'`
- `src/components/splitPreview.component.scss:6` - `height: 140px`
- `src/components/splitPreview.component.scss:24` - `rgba(255, 255, 255, 0.02)`

**Priority**: P3 - Nice to have

**Fix**: Extract to constants:
```typescript
// constants.ts
export const COMMANDS = {
  SETTINGS: '__settings__'
} as const

// _variables.scss
$preview-height: 140px;
$overlay-bg: rgba(255, 255, 255, 0.02);
```

---

### CR-011: Inconsistent Naming Conventions

**Files**: Multiple components

**Priority**: P3 - Nice to have

**Problem**:
- Boolean getters: `get hasUnsavedChanges()` vs methods `canRemovePane()`
- RxJS streams don't use `$` suffix convention

**Fix**: Standardize on one pattern:
- Boolean state: use getters (`get isValid()`, `get hasChanges()`)
- Boolean actions: use methods (`canRemove()`, `shouldUpdate()`)
- RxJS streams: use `$` suffix (`tabOpened$`, `config$`)

---

### CR-012: Over-engineered Focus Logic

**File**: `src/components/workspaceEditor.component.ts:72-80`
**Priority**: P3 - Nice to have

**Problem**: Unnecessary combination of `requestAnimationFrame` and `setTimeout`:
```typescript
private focusNameInput(): void {
  requestAnimationFrame(() => {
    setTimeout(() => {
      // ...
    }, 0)
  })
}
```

**Fix**: Simple `setTimeout(0)` is sufficient:
```typescript
private focusNameInput(): void {
  setTimeout(() => {
    this.nameInput?.nativeElement?.focus()
    this.nameInput?.nativeElement?.select()
  }, 0)
}
```

---

### CR-013: Unused SCSS Mixins

**File**: `src/styles/_mixins.scss`
**Priority**: P3 - Nice to have

**Problem**: Unused mixins:
- `interactive-card` (line 70)
- `icon-btn-opacity` (line 115)

**Fix**: Remove or document as planned for future use.

---

### CR-014: Inefficient Deep Clone

**File**: `src/components/workspaceList.component.ts:65`
**Priority**: P3 - Nice to have

**Problem**: Using `JSON.parse(JSON.stringify())` for deep cloning loses type info and is slow.

**Fix**: Use typed deep clone utility:
```typescript
function deepClone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T
  }
  if (obj !== null && typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      cloned[key] = deepClone(obj[key])
    }
    return cloned
  }
  return obj
}
```

---

## Fix Priority for Next Release

### P0 - Must Fix
- [x] CR-001: Memory Leak in StartupCommandService ✅ Fixed in d99e554
- [x] CR-002: Race Condition in Shell Initialization ✅ Fixed in d99e554
- [x] CR-003: Unsafe Type Casts ✅ Fixed in d99e554

### P1 - Should Fix
- [ ] CR-004: DRY Violation - Tree Walking
- [ ] CR-005: DRY Violation - Button Styles
- [ ] CR-006: Error Handling
- [ ] CR-007: Profile Cache Invalidation

### P2 - Nice to Have
- [ ] CR-008: Change Detection Strategy
- [ ] CR-009: JSDoc Documentation

### P3 - Future Improvement
- [ ] CR-010: Magic Numbers/Strings
- [ ] CR-011: Naming Conventions
- [ ] CR-012: Over-engineered Focus
- [ ] CR-013: Unused Mixins
- [ ] CR-014: Deep Clone Performance
