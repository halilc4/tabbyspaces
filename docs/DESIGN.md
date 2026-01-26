# Design System

TabbySpaces uses a modular DRY SCSS architecture.

## Structure

```
src/styles/
├── _index.scss      # Entry point (imports all)
├── _variables.scss  # Spacing, radius, colors, z-index, transitions
└── _mixins.scss     # Reusable patterns (flex, inputs, buttons, overlays)
```

## Usage

All component SCSS files import shared styles:

```scss
@use '../styles/index' as *;

.my-component {
  padding: $spacing-md;
  border-radius: $radius-lg;
  @include flex-center;
}
```

## Variables

@src/styles/_variables.scss

## Mixins

Key mixins available:

| Mixin | Purpose |
|-------|---------|
| `flex-center` | Center content with flexbox |
| `form-input($bg)` | Styled input field with focus state |
| `form-label` | Uppercase compact label (S1 design) |
| `toolbar-btn` | Small toolbar button with hover state |
| `btn-success` | Green success button |
| `btn-base` | Base button styling with flex layout |
| `btn-ghost` | Ghost button with border |
| `btn-primary` | Primary button with theme color |
| `icon-btn-sm($size)` | Small icon button with border |
| `full-overlay($z)` | Fixed fullscreen overlay |
| `dropdown-panel` | Dropdown with border/shadow |
| `text-ellipsis` | Truncate text with ellipsis |

## Theming

Plugin uses Tabby's CSS custom properties (`--theme-*`) for automatic theme support:
- `--theme-bg`, `--theme-bg-more`, `--theme-bg-more-more`
- `--theme-fg`, `--theme-fg-more`
- `--theme-border`, `--theme-primary`
- `--theme-success`, `--theme-danger`
