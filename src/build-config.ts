// Build-time constants injected by webpack DefinePlugin
declare const __CONFIG_KEY__: string
declare const __DISPLAY_NAME__: string
declare const __IS_DEV__: boolean

export const CONFIG_KEY = typeof __CONFIG_KEY__ !== 'undefined' ? __CONFIG_KEY__ : 'tabbyspaces'
export const DISPLAY_NAME = typeof __DISPLAY_NAME__ !== 'undefined' ? __DISPLAY_NAME__ : 'TabbySpaces'
export const IS_DEV = typeof __IS_DEV__ !== 'undefined' ? __IS_DEV__ : false
