# Dark Mode — Design Specification

**Date:** 2026-04-07  
**Status:** Approved

---

## Overview

Add a user-controlled dark mode to the Notus frontend app. The preference persists across sessions via `localStorage`. The toggle lives on the Profile page.

---

## Architecture

### ThemeContext (`src/context/ThemeContext.jsx`)

- New React context that manages theme state (`'light'` | `'dark'`).
- On mount: reads `localStorage.getItem('theme')`. If `'dark'`, applies dark mode immediately (before first render) by setting `document.documentElement.setAttribute('data-theme', 'dark')`. This prevents a flash of light mode on load.
- `toggleTheme()`: flips state, writes new value to `localStorage`, and sets/removes the `data-theme` attribute on `document.documentElement`.
- Exports `ThemeProvider` component and `useTheme` hook.

### App.jsx

- Wraps the existing `<AuthProvider>` with `<ThemeProvider>`:
  ```jsx
  <ThemeProvider>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </ThemeProvider>
  ```

---

## CSS Overrides (`src/styles/styles.css`)

A single `[data-theme="dark"]` block overrides CSS variables and hardcoded colors.

### Variable overrides

| Variable | Light value | Dark value |
|---|---|---|
| `--bg-light` | `#f8f6f5` | `#0f172a` |
| `--surface-light` | `#ffffff` | `#1e293b` |
| `--border-light` | `#e2e8f0` | `#334155` |
| `--text-primary` | `#0f172a` | `#f1f5f9` |
| `--text-secondary` | `#64748b` | `#94a3b8` |
| `--text-tertiary` | `#94a3b8` | `#64748b` |

### Hardcoded color overrides

These stitch-theme components use hardcoded `rgba` values that do not respond to variable changes:

| Selector | Property | Dark value |
|---|---|---|
| `.top-bar` | `background-color` | `rgba(15, 23, 42, 0.9)` |
| `.bottom-nav-stitch` | `background-color` | `rgba(30, 41, 59, 0.9)` |
| `.attendance-row` | `background` | `#1e293b` |
| `.attendance-list-overlay` | `background` | `#1e293b` |

### Legacy glassmorphism pages

Pages using the legacy glassmorphism dark style (Schedule, Scan, Login) already render white text on dark glass surfaces. They require no changes — they look correct in both light and dark mode.

---

## Profile Page Toggle (`src/pages/global/ProfilePage.jsx`)

- A new button row added inside the existing `.profile-options-wrapper`, above the logout button.
- Styled identically to the existing `.profile-option-btn` buttons.
- Label: **"Tryb ciemny"** (Polish: Dark mode).
- Right-side icon: `dark_mode` (Material Symbols) when in light mode, `light_mode` when in dark mode.
- Calls `toggleTheme()` from `useTheme()` on click.

---

## Data flow

```
localStorage('theme')
       ↓ (on mount)
ThemeContext (isDark, toggleTheme)
       ↓ (sets attribute)
document.documentElement[data-theme="dark"]
       ↓ (CSS cascade)
[data-theme="dark"] { --bg-light: #0f172a; ... }
       ↓
All components using CSS variables adapt automatically
```

---

## Out of scope

- Per-page dark mode overrides beyond the CSS changes listed above.
- Syncing dark mode preference to the backend/user profile.
- Automatic detection of system `prefers-color-scheme` (no auto-follow, manual toggle only).
