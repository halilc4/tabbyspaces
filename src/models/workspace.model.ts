// Tabby profile interfaces
export interface TabbyProfileOptions {
  command?: string
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  restoreFromPTYID?: boolean
  width?: number | null
  height?: number | null
  pauseAfterExit?: boolean
  runAsAdministrator?: boolean
}

export interface TabbyProfile {
  id: string
  type: string
  name: string
  group?: string
  icon?: string
  color?: string
  options?: TabbyProfileOptions
  isBuiltin?: boolean
  isTemplate?: boolean
  weight?: number
  disableDynamicTitle?: boolean
  terminalColorScheme?: string | null
  behaviorOnSessionEnd?: string
}

export interface TabbyRecoveryToken {
  type: string
  orientation?: 'h' | 'v'
  ratios?: number[]
  children?: TabbyRecoveryToken[]
  profile?: Partial<TabbyProfile>
  savedState?: boolean
  tabTitle?: string
  tabCustomTitle?: string
  disableDynamicTitle?: boolean
  cwd?: string
  // Allow custom properties (matches Tabby's RecoveryToken interface)
  [key: string]: any
}

export interface TabbySplitLayoutProfile {
  id: string
  type: 'split-layout'
  name: string
  group: string
  icon?: string
  color?: string
  isBuiltin: boolean
  options: {
    recoveryToken: TabbyRecoveryToken
  }
}

// Workspace interfaces
export interface WorkspacePane {
  id: string
  profileId: string
  cwd?: string
  startupCommand?: string
}

export interface WorkspaceSplit {
  orientation: 'horizontal' | 'vertical'
  ratios: number[]
  children: (WorkspacePane | WorkspaceSplit)[]
}

export interface WorkspaceBackground {
  type: 'none' | 'solid' | 'gradient' | 'image'
  value: string  // CSS value: hex, gradient string, or URL
}

export interface Workspace {
  id: string
  name: string
  icon?: string
  color?: string
  background?: WorkspaceBackground
  root: WorkspaceSplit
  launchOnStartup?: boolean
}

// Preset backgrounds for quick selection
export const BACKGROUND_PRESETS: WorkspaceBackground[] = [
  { type: 'none', value: '' },
  // Existing presets
  { type: 'gradient', value: 'linear-gradient(132deg, transparent 83%, rgba(6, 220, 249, 0.18) 100%), linear-gradient(210deg, transparent 85%, rgba(139, 92, 246, 0.2) 100%)' },
  { type: 'gradient', value: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, transparent 50%)' },
  { type: 'gradient', value: 'linear-gradient(45deg, rgba(239, 68, 68, 0.1) 0%, transparent 50%)' },
  { type: 'gradient', value: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, transparent 50%)' },
  { type: 'gradient', value: 'linear-gradient(225deg, transparent 70%, rgba(249, 115, 22, 0.15) 100%)' },
  { type: 'gradient', value: 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, transparent 40%)' },
  // New presets
  { type: 'gradient', value: 'linear-gradient(315deg, transparent 80%, rgba(236, 72, 153, 0.15) 100%)' }, // Pink bottom-right
  { type: 'gradient', value: 'linear-gradient(0deg, rgba(6, 182, 212, 0.12) 0%, transparent 35%)' }, // Cyan bottom
  { type: 'gradient', value: 'linear-gradient(45deg, transparent 85%, rgba(234, 179, 8, 0.18) 100%), linear-gradient(225deg, transparent 85%, rgba(249, 115, 22, 0.15) 100%)' }, // Gold corners
  { type: 'gradient', value: 'linear-gradient(160deg, rgba(34, 197, 94, 0.12) 0%, transparent 40%)' }, // Green top-left
  { type: 'gradient', value: 'linear-gradient(200deg, transparent 75%, rgba(99, 102, 241, 0.18) 100%)' }, // Indigo bottom-left
  { type: 'gradient', value: 'linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, transparent 50%), linear-gradient(315deg, rgba(139, 92, 246, 0.1) 0%, transparent 50%)' }, // Teal + Violet diagonal
  { type: 'gradient', value: 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, transparent 30%, transparent 70%, rgba(59, 130, 246, 0.08) 100%)' }, // Red-Blue sides
  { type: 'gradient', value: 'linear-gradient(180deg, transparent 60%, rgba(16, 185, 129, 0.12) 100%)' }, // Emerald bottom fade
  { type: 'gradient', value: 'linear-gradient(45deg, rgba(168, 85, 247, 0.1) 0%, transparent 40%), linear-gradient(225deg, rgba(6, 182, 212, 0.1) 0%, transparent 40%)' }, // Purple + Cyan corners
  { type: 'gradient', value: 'linear-gradient(150deg, transparent 70%, rgba(251, 146, 60, 0.15) 100%), linear-gradient(30deg, transparent 70%, rgba(251, 146, 60, 0.1) 100%)' }, // Warm orange accents
]

/**
 * Type guard to check if a node is a WorkspaceSplit.
 * @param node - The node to check
 * @returns True if the node is a WorkspaceSplit
 */
export function isWorkspaceSplit(node: WorkspacePane | WorkspaceSplit): node is WorkspaceSplit {
  return 'orientation' in node && 'children' in node
}

/**
 * Creates a new pane with default configuration.
 * @returns A new WorkspacePane with generated UUID and empty settings
 */
export function createDefaultPane(): WorkspacePane {
  return {
    id: generateUUID(),
    profileId: '',
    cwd: '',
    startupCommand: '',
  }
}

/**
 * Creates a new split with two default panes.
 * @param orientation - Split direction ('horizontal' or 'vertical'), defaults to 'horizontal'
 * @returns A new WorkspaceSplit with two panes at 50/50 ratio
 */
export function createDefaultSplit(orientation: 'horizontal' | 'vertical' = 'horizontal'): WorkspaceSplit {
  return {
    orientation,
    ratios: [0.5, 0.5],
    children: [createDefaultPane(), createDefaultPane()],
  }
}

// Color palette for workspaces
const WORKSPACE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

// Icon list for workspaces
const WORKSPACE_ICONS = [
  'columns', 'terminal', 'code', 'folder', 'home', 'briefcase',
  'cog', 'database', 'server', 'cloud', 'rocket', 'flask',
  'bug', 'wrench', 'cube', 'layer-group', 'sitemap', 'project-diagram'
]

/** Returns a random color from the workspace color palette. */
export function getRandomColor(): string {
  return WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)]
}

/** Returns a random icon from the workspace icon set. */
export function getRandomIcon(): string {
  return WORKSPACE_ICONS[Math.floor(Math.random() * WORKSPACE_ICONS.length)]
}

/**
 * Creates a new workspace with default configuration.
 * @param name - Display name for the workspace (optional)
 * @returns A new Workspace with generated UUID, random icon/color, and a default split
 */
export function createDefaultWorkspace(name: string = ''): Workspace {
  return {
    id: generateUUID(),
    name,
    icon: getRandomIcon(),
    color: getRandomColor(),
    root: createDefaultSplit(),
    launchOnStartup: false,
  }
}

/** Generates a random UUID v4 string. */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Recursively counts the total number of panes in a split tree.
 * @param node - The root node to count from
 * @returns Total number of panes in the tree
 */
export function countPanes(node: WorkspacePane | WorkspaceSplit): number {
  if (isWorkspaceSplit(node)) {
    return node.children.reduce((sum, child) => sum + countPanes(child), 0)
  }
  return 1
}

/**
 * Creates a deep clone of an object, preserving type information.
 * More efficient than JSON.parse(JSON.stringify()) for simple objects.
 * @param obj - The object to clone
 * @returns A deep copy of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T
  }
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}
