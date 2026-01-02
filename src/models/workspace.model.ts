export interface WorkspacePane {
  id: string
  profileId: string
  cwd?: string
  startupCommand?: string
  title?: string
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
  isDefault?: boolean
  hotkey?: string
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
    title: '',
  }
}

export function createDefaultSplit(orientation: 'horizontal' | 'vertical' = 'horizontal'): WorkspaceSplit {
  return {
    orientation,
    ratios: [0.5, 0.5],
    children: [createDefaultPane(), createDefaultPane()],
  }
}

export function createDefaultWorkspace(name: string = 'New Workspace'): Workspace {
  return {
    id: generateUUID(),
    name,
    icon: 'columns',
    color: '#3b82f6',
    root: createDefaultSplit(),
    isDefault: false,
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
