# UI Design Guide

This file defines the visual language for all games in this repo. Claude Code must read
this file before writing any CSS. All games should feel like they belong to the same
family — consistent spacing, typography, color usage, and interaction patterns.

---

## Color Palette

Paste these into every game's `global.css` inside `:root {}`:

```css
:root {
  /* Brand */
  --theme-color: #0a0a23;
  --yellow-gold: #ffbf00;

  /* Neutrals */
  --gray-00: #ffffff;
  --gray-00-translucent: rgba(255, 255, 255, 0.85);
  --gray-05: #f5f6f7;
  --gray-10: #dfdfe2;
  --gray-15: #d0d0d5;
  --gray-45: #858591;
  --gray-75: #3b3b4f;
  --gray-80: #2a2a40;
  --gray-85: #1b1b32;
  --gray-90: #0a0a23;
  --gray-90-translucent: rgba(10, 10, 35, 0.85);

  /* Purple */
  --purple-light: #dbb8ff;
  --purple-mid: #9400d3;
  --purple-dark: #5a01a7;

  /* Yellow */
  --yellow-light: #ffc300;
  --yellow-dark: #4d3800;

  /* Blue */
  --blue-light: rgb(153, 201, 255);
  --blue-light-translucent: rgba(153, 201, 255, 0.3);
  --blue-mid: #198eee;
  --blue-dark: rgb(0, 46, 173);
  --blue-dark-translucent: rgba(0, 46, 173, 0.3);

  /* Green */
  --green-light: #acd157;
  --green-dark: #00471b;

  /* Red */
  --red-light: #ffadad;
  --red-dark: #850000;

  /* Semantic — use these in components, not raw colors */
  --color-bg: var(--gray-90);
  --color-surface: var(--gray-85);
  --color-surface-raised: var(--gray-80);
  --color-border: var(--gray-75);
  --color-text-primary: var(--gray-00);
  --color-text-secondary: var(--gray-15);
  --color-text-muted: var(--gray-45);
  --color-accent: var(--yellow-gold);
  --color-accent-hover: var(--yellow-light);
  --color-success: var(--green-light);
  --color-danger: var(--red-light);
}
```

**Always use semantic variables in components** (`--color-bg`, `--color-accent`, etc.)
rather than raw palette variables (`--gray-90`, `--yellow-gold`). This makes it easy to
adjust the theme later without touching every component.

---

## Typography

```css
/* In global.css */
@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Inconsolata:wght@400;700&display=swap');

:root {
  --font-body: 'Lato', sans-serif;
  --font-mono: 'Inconsolata', monospace;

  --text-sm: 0.875rem;   /* 14px — labels, hints */
  --text-md: 1rem;       /* 16px — body, buttons */
  --text-lg: 1.25rem;    /* 20px — subheadings */
  --text-xl: 1.5rem;     /* 24px — headings */
  --text-2xl: 2rem;      /* 32px — page titles */

  --weight-normal: 400;
  --weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
}

body {
  font-family: var(--font-body);
  font-size: var(--text-md);
  font-weight: var(--weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-bg);
}
```

**Rules:**
- Use `--font-body` for all UI text
- Use `--font-mono` for scores, timers, counters, or any number display
- Never mix more than two font sizes in the same UI region
- Headings are bold, body is normal weight

---

## Spacing Scale

Always use these values for margin, padding, and gap. Never use arbitrary numbers.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;
}
```

**Rules:**
- Tight groupings (label + input, icon + text): `--space-1` or `--space-2`
- Component internal padding: `--space-3` or `--space-4`
- Between components: `--space-5` or `--space-6`
- Page-level padding: `--space-6` or `--space-7`

---

## Borders, Radius & Shadows

```css
:root {
  --radius-sm: 4px;    /* small elements: badges, tags */
  --radius-md: 8px;    /* buttons, inputs, cards */
  --radius-lg: 16px;   /* modals, overlays, game boards */
  --radius-full: 9999px; /* pills, round buttons */

  --border-default: 1px solid var(--color-border);
  --border-accent: 2px solid var(--color-accent);
  --border-focus: 2px solid var(--blue-mid);

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-accent: 0 0 12px rgba(255, 191, 0, 0.3); /* gold glow for highlights */
}
```

---

## Transitions

```css
:root {
  --transition-fast: 120ms ease;
  --transition-default: 200ms ease;
  --transition-slow: 350ms ease;
}
```

**Rules:**
- All interactive elements must have a transition — minimum `color` and `background-color`
- Hover: `--transition-fast`
- State changes (show/hide, active/inactive): `--transition-default`
- Animations (result screen appearing, board reset): `--transition-slow`

---

## Buttons

```css
/* Base button — apply to all buttons */
.btn {
  font-family: var(--font-body);
  font-size: var(--text-md);
  font-weight: var(--weight-bold);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  transition: background-color var(--transition-fast),
              transform var(--transition-fast),
              box-shadow var(--transition-fast);
}

.btn:active {
  transform: scale(0.97);
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

/* Primary — main actions */
.btn-primary {
  background-color: var(--color-accent);
  color: var(--gray-90);
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-accent-hover);
  box-shadow: var(--shadow-accent);
}

/* Secondary — supporting actions */
.btn-secondary {
  background-color: var(--color-surface-raised);
  color: var(--color-text-primary);
  border: var(--border-default);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-border);
}
```

**Rules:**
- Every button must have a visible hover state and an active (pressed) state
- Primary buttons use `--color-accent` (gold)
- Secondary buttons use surface colors with a border
- Disabled buttons use `opacity: 0.4` — never just remove the button

---

## Game Boards & Cards

```css
.card {
  background-color: var(--color-surface);
  border: var(--border-default);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-md);
}
```

**Rules:**
- Game boards and UI panels sit on `--color-surface`, not directly on `--color-bg`
- This creates depth — background → surface → raised surface
- Use `--shadow-md` or `--shadow-lg` on the main game container so it lifts off the page

---

## Interactive States

Every interactive element needs all four states styled:

| State    | What to change                          |
|----------|-----------------------------------------|
| Default  | Base styles                             |
| Hover    | Lighten background or add glow/shadow   |
| Active   | Slight scale down (`scale(0.97)`)       |
| Disabled | `opacity: 0.4`, `cursor: not-allowed`   |

Never rely on browser defaults for any of these.

---

## Game-Specific Patterns

**Status messages** (whose turn, win, draw):
- Use `--text-lg` or `--text-xl`, bold
- Win: `--color-success` (green)
- Loss/danger: `--color-danger` (red)
- Neutral (turn indicator): `--color-text-primary` or `--color-accent`

**Score/counter displays:**
- Always use `--font-mono` so numbers don't jump width as they change

**Overlays and result screens:**
- Background: `--gray-90-translucent` over the board
- Content panel: `--color-surface` with `--radius-lg` and `--shadow-lg`
- Animate in with a fade + slight scale: `opacity 0 → 1`, `scale(0.95) → scale(1)`

**Highlighted/selected squares:**
- Border: `--border-accent`
- Or background: `--blue-light-translucent` or `--shadow-accent` glow

---

## Layout

```css
/* global.css */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
}
```

**Rules:**
- Center game content both vertically and horizontally on the page
- Always include `box-sizing: border-box` reset
- Games should be usable on mobile — use `max-width` on the game container and let it
  shrink gracefully. A good default: `max-width: 480px; width: 100%`

---

## Checklist Before Submitting Any UI

- [ ] All colors use semantic variables (`--color-bg`, not `--gray-90`)
- [ ] All spacing uses scale variables (`--space-4`, not `16px`)
- [ ] All interactive elements have hover, active, and disabled states
- [ ] All interactive elements have a transition
- [ ] Numbers/scores use `--font-mono`
- [ ] Game container has `max-width` and is centered
- [ ] Tested at mobile width (375px)