# TODO

## Workspace Editor - Layout Editing

- [x] Skloniti dva dugmeta layout vert/hor iz toolbara (kao i horizontal/vertical tekst iz liste)
- [x] Omogućiti selekciju u toolbaru, dodati dugme za edit pane-a (da ne bude na klik)
- [x] Kada je selektovan item u toolbaru - prikazati opcije slične context meniju
- [x] Context menu od pane-a: add to left/right/top/bottom pored split opcija + edit pane
- [x] Umesto "click to edit" - ikonica za edit u ćošku pane-a
- [ ] Title bug - bolje handleati
- [ ] Srediti design

## UX Improvements

- [ ] Launch on startup: prebaciti sa single workspace opcije na on-startup (bez default-a)
- [ ] Not-saved / "you have changes" indicator (uporediti stanje posle promene sa sačuvanim)
- [ ] New workspace: fokus na name input, bez default vrednosti, placeholder "Name your workspace"
- [ ] Lista: dodati mali preview layouta

## Other

- [ ] Bolji input za command
- [ ] Bolji input za cwd
- [x] Split pane-a pokrene komandu (nije zeljeno ponasanje)
- [x] Otvaranje workspace-a iz workspace editor-a
- [x] Prebaciti workspace edit dialog inline iznad spiska workspace-ova (uvek jedan selektovan)
- [x] Icon picker kao dropdown pored color pickera (slican UI)
- [x] Randomizovati boju i ikonicu na new workspace + fokus na name input
- [x] Refaktorisanje: Ukloniti profile persistence, shell-aware CWD, dead code cleanup

## Bugs

- [ ] Migracija i brisanje profila ne radi
- [ ] Layout preview responsive - nested splits se ne prilagođavaju dobro na manje veličine
- [x] Built-in shells (PowerShell, cmd, WSL) nisu radili - filter tražio `type === 'local'` umesto `type.startsWith('local:')`
- [x] Fallback za built-in profile lookup (keširanje svih profila pre otvaranja workspace-a)

## CWD - REŠENO

CWD koristi native `options.cwd` u recovery tokenu - shell se pokreće direktno u željenom direktorijumu bez vidljivih `cd` komandi.
