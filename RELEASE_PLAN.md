# TabbySpaces - Public Release Plan

## Goal

Create a public repo that enables:
1. Users to install the plugin from Tabby Plugin Manager
2. Developers to contribute (fork → develop → PR)
3. Maintainer (Igor) to test both dev and production versions simultaneously

---

## 1. Package.json Changes

- [x] Version: `1.0.0` → `0.0.1`
- [x] Add `repository` field
- [x] Add `homepage` field
- [x] Add `bugs` field
- [x] Clean up `scripts` section - removed TABBY_PLUGINS dependency

---

## 2. Dev Workflow

**Approach:** build:dev + install to plugins folder

**Working:**
- [x] `npm run build:dev` - creates dist-dev/ with isolated package
- [x] Installation to plugins folder

**Known issues:**
- [x] ~~Prod and dev plugin have same name in Tabby UI~~ (FIXED)

**TODO:**
- [x] ~~Fix UI name isolation~~ (DONE - toolbar, settings, profile groups)
- [ ] Test watch mode
- [ ] Document in README

---

## 3. Testing

**Coexistence (maintainer)** ✅ WORKS
```
tabby-tabbyspaces (prod) + tabby-tabbyspaces-dev (dev) in plugins folder
Different config keys, different names in UI
```

**Notes:**
- Contributor workflow will be documented in CONTRIBUTING.md
- Production test will be live npm publish

---

## 4. Required Files

| File | Status | Priority |
|------|--------|----------|
| `README.md` | DONE | P0 |
| `LICENSE` | DONE | P0 |
| `CHANGELOG.md` | DONE | P0 |
| `CONTRIBUTING.md` | DONE | P0 |
| `.github/ISSUE_TEMPLATE/*` | DONE | P0 |
| `CLAUDE.md` | DONE (EN) | P0 |
| `screenshots/` | DONE | P0 |

---

## 5. Distribution

**Method:** npm publish (only way to appear in Tabby Plugin Manager)

**Process:**
```bash
# Setup (once)
npm login

# Release
npm version patch  # or minor/major
npm publish
```

**Pre-publish checklist:**
- [x] Version bumped
- [x] Build works (`npm run build`)
- [x] README updated
- [x] CHANGELOG updated

### Releases

| Version | Date | Status |
|---------|------|--------|
| 0.0.1 | 2026-01-03 | ✅ Published to npm |

---

## 6. GitHub Repo Setup

- [x] Create repo: `github.com/halilc4/tabbyspaces`
- [x] Add description
- [x] Add topics: `tabby`, `tabby-plugin`, `terminal`, `workspace`
- [x] Enable Issues
- [x] Push code

---

## 7. Action Sequence

```
1. [x] Solve dev workflow → build:dev approach
2. [x] Fix dev vs prod isolation (name in UI)
3. [x] Test coexistence (maintainer scenario)
4. [x] Create LICENSE (MIT, English)
5. [x] Create README.md (English, Claude Code attribution, screenshots)
6. [x] Create CHANGELOG.md
7. [x] Create CONTRIBUTING.md
8. [x] Create .github/ISSUE_TEMPLATE/*
9. [x] Translate CLAUDE.md to English
10. [x] Create GitHub repo (halilc4/tabbyspaces)
11. [x] Push
12. [x] npm publish
13. [ ] Test installation from Tabby Plugin Manager
```

---

## Decisions

1. **GitHub username** - `halilc4` → `github.com/halilc4/tabbyspaces`
2. **CHANGELOG** - YES, we maintain it
3. **Languages** - README and LICENSE in English
4. **Attribution** - README must clearly state:
   - Code 100% written by Claude Code
   - Igor = idea and product vision
   - Igor hates Angular so much he didn't even look at the code

---

## Open Questions

~~1. **CLAUDE.md language** - Translate to English for contributors?~~ → YES, English

---

## 8. Final Review (2026-01-03)

**Status:** ✅ PASS

**Reviewed:**
- [x] Project structure - clean, standard Angular pattern
- [x] Code - typed, no `any`, readable
- [x] README.md - clear, with screenshots
- [x] LICENSE, CONTRIBUTING.md, CHANGELOG.md - complete
- [x] package.json metadata - repo, bugs, homepage
- [x] .github/ISSUE_TEMPLATE/* - bug report, feature request
- [x] Dev/Prod isolation - works

**Conclusion:** Project is ready for public release.

---

## 9. Release 0.0.1 (2026-01-03)

**Status:** ✅ PUBLISHED

- GitHub repo: https://github.com/halilc4/tabbyspaces
- npm: https://www.npmjs.com/package/tabby-tabbyspaces

**Remaining:**
- [ ] Test installation from Tabby Plugin Manager

---

## Documentation Style

- No mainstream GitHub corporate style
- No AI slop (generic, over-polished)
- Direct, honest, with character
