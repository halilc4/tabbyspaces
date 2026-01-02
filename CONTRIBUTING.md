# Contributing

You want to contribute to an Angular project? Respect.

## Before you start

Read [CLAUDE.md](CLAUDE.md). It has the technical context: data model, Tabby plugin patterns, known issues.

## Setup

```bash
git clone https://github.com/halilc4/tabbyspaces.git
cd tabbyspaces
npm install
npm run build:dev
```

Install the dev build in Tabby:
```bash
cd %APPDATA%\tabby\plugins   # Windows
cd ~/.config/tabby/plugins    # Linux
cd ~/Library/Application\ Support/tabby/plugins  # macOS

npm install "<path-to-repo>/dist-dev"
```

Restart Tabby. You should see "TabbySpaces DEV" in Settings.

## Development workflow

```bash
npm run build:dev   # rebuild
# restart Tabby to see changes
```

No hot reload. Tabby doesn't support it for plugins. Restart after each build.

## What we need

- Bug fixes (check Issues)
- UX improvements
- Better split layout manipulation
- Drag & drop support
- Import/export workspaces

## Pull requests

1. Fork the repo
2. Create a branch (`git checkout -b fix/thing`)
3. Make your changes
4. Test manually in Tabby
5. Submit PR with a clear description

No strict commit message format. Just be clear about what you changed and why.

## Code style

- TypeScript, strongly typed
- No `any` unless absolutely necessary
- Keep it simple - this isn't enterprise software

## Questions?

Open an issue. Don't overthink it.
