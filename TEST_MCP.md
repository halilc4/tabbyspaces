# MCP Testiranje TabbySpaces

Uputstvo za Claude da testira plugin kroz tabby-mcp.

## Pre-requisites

1. Build plugin: `npm run build:dev`
2. Pokreni NOVI Tabby instance sa debug portom:
   ```bash
   cmd.exe /c start "" "C:\Program Files (x86)\Tabby\Tabby.exe" --remote-debugging-port=9222
   ```

## Test 1: Proveri da nema orphaned profila

```javascript
// Očekivano: Nema split-layout:tabbyspaces_dev: profila u config
mcp__tabby__execute_js(target: -1, code: `
  const profiles = window.require('tabby-core').ConfigService.store.profiles || []
  const orphaned = profiles.filter(p => p.id?.startsWith('split-layout:tabbyspaces'))
  JSON.stringify({ total: profiles.length, orphaned: orphaned.length, ids: orphaned.map(p => p.id) })
`)
```

**Očekivan rezultat:** `orphaned: 0`

## Test 2: Otvori Settings i proveri plugin

```javascript
// Klikni na Settings
mcp__tabby__execute_js(target: -1, code: `
  document.querySelector('[title="Settings"]')?.click()
  'Settings opened'
`)

// Sačekaj 500ms, pa klikni na TabbySpaces DEV tab
mcp__tabby__execute_js(target: -1, code: `
  const tabs = Array.from(document.querySelectorAll('.nav-link'))
  const devTab = tabs.find(t => t.textContent.includes('TabbySpaces DEV'))
  devTab?.click()
  devTab ? 'TabbySpaces DEV tab clicked' : 'Tab not found'
`)
```

## Test 3: Kreiraj test workspace

```javascript
// Klikni New Workspace
mcp__tabby__execute_js(target: -1, code: `
  const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('New Workspace'))
  btn?.click()
  btn ? 'New Workspace clicked' : 'Button not found'
`)

// Unesi ime
mcp__tabby__execute_js(target: -1, code: `
  const input = document.querySelector('.name-input')
  if (input) {
    input.value = 'MCP Test Workspace'
    input.dispatchEvent(new Event('input', { bubbles: true }))
    'Name set'
  } else 'Input not found'
`)

// Sačuvaj
mcp__tabby__execute_js(target: -1, code: `
  const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save'))
  saveBtn?.click()
  saveBtn ? 'Saved' : 'Save button not found'
`)
```

## Test 4: Proveri da NIJE kreiran profil u config.store.profiles

```javascript
mcp__tabby__execute_js(target: -1, code: `
  const profiles = window.require('tabby-core').ConfigService.store.profiles || []
  const wsProfiles = profiles.filter(p => p.id?.includes('mcp-test-workspace'))
  JSON.stringify({ found: wsProfiles.length, message: wsProfiles.length === 0 ? 'PASS - No profile created' : 'FAIL - Profile was created' })
`)
```

**Očekivan rezultat:** `found: 0, message: "PASS - No profile created"`

## Test 5: Testiraj CWD injection (Shell Detection)

```javascript
// Testiraj shell detection funkciju
mcp__tabby__execute_js(target: -1, code: `
  // Simuliraj shell detection
  function detectShellType(command) {
    const cmd = command.toLowerCase()
    if (cmd.includes('nu.exe') || cmd.includes('nushell') || cmd.endsWith('/nu')) return 'nushell'
    if (cmd.includes('powershell') || cmd.includes('pwsh')) return 'powershell'
    if (cmd.includes('cmd.exe') || cmd.endsWith('\\\\cmd')) return 'cmd'
    if (cmd.includes('bash') || cmd.includes('zsh') || cmd.includes('fish') || cmd.includes('/sh')) return 'posix'
    return 'unknown'
  }

  const tests = [
    { cmd: 'C:\\\\Programs\\\\nu\\\\bin\\\\nu.exe', expected: 'nushell' },
    { cmd: 'C:\\\\Windows\\\\System32\\\\WindowsPowerShell\\\\v1.0\\\\powershell.exe', expected: 'powershell' },
    { cmd: 'pwsh.exe', expected: 'powershell' },
    { cmd: 'C:\\\\Windows\\\\System32\\\\cmd.exe', expected: 'cmd' },
    { cmd: '/usr/bin/bash', expected: 'posix' },
    { cmd: '/bin/zsh', expected: 'posix' },
  ]

  const results = tests.map(t => ({
    cmd: t.cmd,
    expected: t.expected,
    actual: detectShellType(t.cmd),
    pass: detectShellType(t.cmd) === t.expected
  }))

  JSON.stringify({ passed: results.filter(r => r.pass).length, total: results.length, results }, null, 2)
`)
```

**Očekivan rezultat:** `passed: 6, total: 6`

## Test 6: Otvori workspace iz toolbar-a

```javascript
// Klikni na TabbySpaces toolbar button (4 squares icon)
mcp__tabby__execute_js(target: -1, code: `
  const toolbarBtns = document.querySelectorAll('toolbar-button')
  const wsBtn = Array.from(toolbarBtns).find(b => b.querySelector('svg rect'))
  wsBtn?.click()
  wsBtn ? 'Toolbar button clicked' : 'Button not found'
`)

// Selektuj workspace iz liste
mcp__tabby__execute_js(target: -1, code: `
  const options = document.querySelectorAll('.selector-option')
  const testWs = Array.from(options).find(o => o.textContent.includes('MCP Test'))
  testWs?.click()
  testWs ? 'Workspace selected' : 'Workspace not found in selector'
`)
```

## Test 7: Proveri otvorene tabove

```javascript
mcp__tabby__execute_js(target: -1, code: `
  const tabs = document.querySelectorAll('.tab')
  const tabInfo = Array.from(tabs).map(t => ({
    title: t.querySelector('.tab-title')?.textContent || 'unknown',
    active: t.classList.contains('active')
  }))
  JSON.stringify(tabInfo)
`)
```

## Cleanup

```javascript
// Zatvori test tab
mcp__tabby__execute_js(target: -1, code: `
  const closeBtn = document.querySelector('.tab.active .btn-close')
  closeBtn?.click()
  'Tab closed'
`)
```

## Quick Full Test Sequence

```
1. mcp__tabby__list_targets  (uzmi poslednji target)
2. Test 1: Proveri orphaned profile
3. Test 5: Shell detection
4. Test 2: Otvori settings
5. Test 3: Kreiraj workspace
6. Test 4: Proveri da nema profila
7. Test 6: Otvori workspace
8. Test 7: Proveri tabove
```
