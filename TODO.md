# TODO

## Workspace Editor - Layout Editing

- [x] Skloniti dva dugmeta layout vert/hor iz toolbara (kao i horizontal/vertical tekst iz liste)
- [x] Omogućiti selekciju u toolbaru, dodati dugme za edit pane-a (da ne bude na klik)
- [x] Kada je selektovan item u toolbaru - prikazati opcije slične context meniju
- [x] Context menu od pane-a: add to left/right/top/bottom pored split opcija + edit pane
- [x] Umesto "click to edit" - ikonica za edit u ćošku pane-a
- [x] Title bug - bolje handleati
- [ ] Srediti design
- [ ] Naći lepši način za prikaz nested pane-ova u editoru
- [x] Edit ikonica na pane-u: prikazati na hover umesto na selekciju

## UX Improvements

- [x] Prebaciti run dugme u workspace listu
- [x] Launch on startup: prebaciti sa single workspace opcije na multi-select (više workspace-a može biti označeno)
- [x] Not-saved / "you have changes" indicator (uporediti stanje posle promene sa sačuvanim)
- [x] New workspace: fokus na name input, bez default vrednosti, placeholder "Name your workspace"
- [ ] Lista: dodati mali preview layouta
- [x] Save dugme: disabled kada nema izmena, enabled kada ima (zamena za indikator)
- [x] Duplicate: selektuje novi workspace nakon dupliciranja
- [x] Open/Run/Duplicate/Delete dugmići selektuju workspace - dodati stopPropagation
- [x] Preimenovati "Run" u "Open" sa odgovarajućom ikonicom

## Other

- [x] Različita ikonica za DEV verziju (lakše razlikovanje u Settings)
- [ ] Update screenshots in README
- [ ] Bolji input za command
- [ ] Bolji input za cwd
- [x] Otvaranje workspace-a iz workspace editor-a
- [x] Prebaciti workspace edit dialog inline iznad spiska workspace-ova (uvek jedan selektovan)
- [x] Icon picker kao dropdown pored color pickera (slican UI)
- [x] Randomizovati boju i ikonicu na new workspace + fokus na name input
- [x] Refaktorisanje: Ukloniti profile persistence, shell-aware CWD, dead code cleanup

## Bugs

- [ ] Audit async funkcija - proveriti da li fali `detectChanges()` posle async operacija koje menjaju state (duplicateWorkspace, deleteWorkspace, onEditorSave, openWorkspace)
- [x] Split pane-a pokrene komandu (in-memory profiles) - fix: čišćenje profile.options.args posle izvršenja komande
- [x] Pane editor modal bug - mouseup izvan dialoga zatvara modal (npr. selekcija teksta pa prevlačenje miša van). Dialog treba zatvarati samo na Esc ili dugme close/cancel/save, bez click-outside. Primeniti na sve buduće dialoge.
- [~] Resize pane-ova u Tabby-u se vraća na originalne vrednosti (ratio problem) - WATCH: dešava se samo na jednom workspace-u
- [ ] Migracija i brisanje profila ne radi
- [ ] Layout preview responsive - nested splits se ne prilagođavaju dobro na manje veličine
- [x] New workspace: fokus na name input ne radi
- [x] Built-in shells (PowerShell, cmd, WSL) nisu radili - filter tražio `type === 'local'` umesto `type.startsWith('local:')`
- [x] Fallback za built-in profile lookup (keširanje svih profila pre otvaranja workspace-a)

## CWD - REŠENO

CWD koristi native `options.cwd` u recovery tokenu - shell se pokreće direktno u željenom direktorijumu bez vidljivih `cd` komandi.
