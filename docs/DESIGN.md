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
@import '../styles/index';

.my-component {
  padding: $spacing-md;
  border-radius: $radius-lg;
  @include flex-row($spacing-sm);
}
```

## Variables

@src/styles/_variables.scss

## Mixins

Key mixins available:

| Mixin | Purpose |
|-------|---------|
| `flex-row($gap)` | Horizontal flex with gap |
| `flex-col($gap)` | Vertical flex with gap |
| `flex-center` | Center content |
| `flex-between` | Space between |
| `form-input($bg)` | Styled input field |
| `interactive-card($radius)` | Clickable card with hover/selected states |
| `toolbar-btn` | Small toolbar button |
| `btn-success` | Green success button |
| `icon-btn-opacity` | Icon with hover opacity |
| `full-overlay($z)` | Fixed fullscreen overlay |
| `dropdown-panel` | Dropdown with border/shadow |
| `text-ellipsis` | Truncate text with ellipsis |

## Theming

Plugin uses Tabby's CSS custom properties (`--theme-*`) for automatic theme support:
- `--theme-bg`, `--theme-bg-more`, `--theme-bg-more-more`
- `--theme-fg`, `--theme-fg-more`
- `--theme-border`, `--theme-primary`
- `--theme-success`, `--theme-danger`
