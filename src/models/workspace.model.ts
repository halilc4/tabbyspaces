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

export interface Workspace {
  id: string
  name: string
  icon?: string
  color?: string
  root: WorkspaceSplit
  launchOnStartup?: boolean
}

export function isWorkspaceSplit(node: WorkspacePane | WorkspaceSplit): node is WorkspaceSplit {
  return 'orientation' in node && 'children' in node
}

export function createDefaultPane(): WorkspacePane {
  return {
    id: generateUUID(),
    profileId: '',
    cwd: '',
    startupCommand: '',
  }
}

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

export function getRandomColor(): string {
  return WORKSPACE_COLORS[Math.floor(Math.random() * WORKSPACE_COLORS.length)]
}

export function getRandomIcon(): string {
  return WORKSPACE_ICONS[Math.floor(Math.random() * WORKSPACE_ICONS.length)]
}

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

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function countPanes(node: WorkspacePane | WorkspaceSplit): number {
  if (isWorkspaceSplit(node)) {
    return node.children.reduce((sum, child) => sum + countPanes(child), 0)
  }
  return 1
}
