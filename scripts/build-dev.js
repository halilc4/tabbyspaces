const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const distDevDir = path.join(rootDir, 'dist-dev')

// 1. Clean dist-dev
if (fs.existsSync(distDevDir)) {
  fs.rmSync(distDevDir, { recursive: true })
}

// 2. Run webpack with dev env directly to dist-dev
console.log('Building dev version...')
execSync(`npx webpack --mode production --env dev --output-path "${distDevDir}"`, {
  cwd: rootDir,
  stdio: 'inherit'
})

// 3. Create dev package.json
const pkg = require(path.join(rootDir, 'package.json'))
const devPkg = {
  name: 'tabby-tabbyspaces-dev',
  version: pkg.version,
  description: pkg.description + ' (DEV)',
  main: 'index.js',
  keywords: pkg.keywords,
  peerDependencies: pkg.peerDependencies,
  author: pkg.author,
  license: pkg.license,
  tabbyPlugin: {
    name: 'tabbyspaces-dev',
    displayName: 'TabbySpaces DEV',
    description: pkg.tabbyPlugin.description + ' (DEV)'
  }
}

fs.writeFileSync(
  path.join(distDevDir, 'package.json'),
  JSON.stringify(devPkg, null, 2)
)

console.log('Dev build complete: dist-dev/')
console.log('')
console.log('To install:')
console.log(`  cd "$APPDATA/tabby/plugins" && npm install "${distDevDir.replace(/\\/g, '/')}"`)
