# TabbySpaces - Public Release Plan

## Cilj

Napraviti public repo koji omogućava:
1. Korisnicima da instaliraju plugin iz Tabby Plugin Manager-a
2. Developerima da doprinose (fork → develop → PR)
3. Maintaineru (Igor) da testira i dev i production verziju istovremeno

---

## 1. Package.json izmene

- [x] Verzija: `1.0.0` → `0.0.1`
- [x] Dodaj `repository` polje
- [x] Dodaj `homepage` polje
- [x] Dodaj `bugs` polje
- [x] Sredi `scripts` sekciju - uklonjena TABBY_PLUGINS zavisnost

---

## 2. Dev Workflow

**Pristup:** build:dev + instalacija u plugins folder

**Radi:**
- [x] `npm run build:dev` - kreira dist-dev/ sa izolovanim package-om
- [x] Instalacija u plugins folder

**Poznati problemi:**
- [x] ~~Prod i dev plugin imaju isto ime u Tabby UI~~ (REŠENO)

**TODO:**
- [x] ~~Popraviti izolaciju imena u UI~~ (DONE - toolbar, settings, profile groups)
- [ ] Testirati watch mode
- [ ] Dokumentovati u README

---

## 3. Testiranje

**Koegzistencija (maintainer)** ✅ RADI
```
tabby-tabbyspaces (prod) + tabby-tabbyspaces-dev (dev) u plugins folderu
Različiti config keys, različita imena u UI
```

**Napomene:**
- Contributor workflow će biti dokumentovan u CONTRIBUTING.md
- Production test će biti live npm publish

---

## 4. Potrebni fajlovi

| Fajl | Status | Prioritet |
|------|--------|-----------|
| `README.md` | DONE | P0 |
| `LICENSE` | DONE | P0 |
| `CHANGELOG.md` | DONE | P0 |
| `CONTRIBUTING.md` | DONE | P0 |
| `.github/ISSUE_TEMPLATE/*` | DONE | P0 |
| `CLAUDE.md` | DONE (EN) | P0 |
| `screenshots/` | DONE | P0 |

---

## 5. Distribucija

**Metod:** npm publish (jedini način da se pojavi u Tabby Plugin Manager-u)

**Proces:**
```bash
# Setup (jednom)
npm login

# Release
npm version patch  # ili minor/major
npm publish
```

**Pre-publish checklist:**
- [ ] Verzija bump-ovana
- [ ] Build radi (`npm run build`)
- [ ] README ažuriran
- [ ] CHANGELOG ažuriran

---

## 6. GitHub Repo Setup

- [ ] Kreiraj repo: `github.com/halilc4/tabbyspaces`
- [ ] Dodaj opis
- [ ] Dodaj topics: `tabby`, `tabby-plugin`, `terminal`, `workspace`
- [ ] Uključi Issues
- [ ] Push koda

---

## 7. Redosled akcija

```
1. [x] Reši dev workflow → build:dev pristup
2. [x] Popravi dev vs prod izolaciju (ime u UI)
3. [x] Testiraj koegzistenciju (maintainer scenario)
4. [x] Napravi LICENSE (MIT, engleski)
5. [x] Napravi README.md (engleski, Claude Code attribution, screenshots)
6. [x] Napravi CHANGELOG.md
7. [x] Napravi CONTRIBUTING.md
8. [x] Napravi .github/ISSUE_TEMPLATE/*
9. [x] Prevedi CLAUDE.md na engleski
10. [ ] Kreiraj GitHub repo (halilc4/tabbyspaces)
11. [ ] Push
12. [ ] npm publish
13. [ ] Testiraj instalaciju iz Tabby Plugin Manager-a
```

---

## Odluke

1. **GitHub username** - `halilc4` → `github.com/halilc4/tabbyspaces`
2. **CHANGELOG** - DA, vodimo ga
3. **Jezici** - README i LICENSE na engleskom
4. **Attribution** - README mora jasno naglasiti:
   - Kod 100% napisan od Claude Code-a
   - Igor = ideja i product vision
   - Igor toliko mrzi Angular da nije ni pogledao kod

---

## Otvorena pitanja

~~1. **CLAUDE.md jezik** - Prevesti na engleski za contributore?~~ → DA, engleski

## Stil dokumentacije

- Bez mainstream GitHub corporate stila
- Bez AI slop-a (generic, over-polished)
- Direktno, iskreno, sa karakterom
