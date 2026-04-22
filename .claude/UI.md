# UI Design Guide

All games share the same visual language. Read this file before writing any CSS.

See `.claude/examples/` for screenshots of existing games — use these as a visual reference for layout, style, and overall feel.

CSS variables (colors, spacing, typography, shadows, transitions, radius) are defined in `global.css` — use them, never hardcode values.

Every game should look polished and intentional — not like a default browser UI. If something looks flat, add depth. If something snaps and would be better with a transition, add a transition. If something feels generic, it probably is.

---

## Core Rules

- Always use semantic variables (`--color-bg`, `--color-accent`) — never raw ones (`--gray-90`)
- Always use spacing scale variables (`--space-4`, not `16px`)
- Use `--font-mono` for scores, timers, counters, and any number display
- Never mix more than two font sizes in the same UI region

---

## Spacing Guidelines

- Tight groupings (label + input, icon + text): `--space-1` or `--space-2`
- Component internal padding: `--space-3` or `--space-4`
- Between components: `--space-5` or `--space-6`
- Page-level padding: `--space-6` or `--space-7`

---

## Buttons

- Use the icons in `./claude/icons` when applicable.
- Primary buttons use a subtle gradient on `--color-accent`, not flat color
- Secondary buttons use surface colors with a border
- Every button must have hover (lift `-1px`, stronger shadow), active (scale down, push shadow inward), and disabled (`opacity: 0.4`) states
- All state changes use transitions — nothing snaps

---

## Surfaces

- Game boards and panels sit on `--color-surface`, not directly on `--color-bg`
- No surface should be a completely flat solid color — use a subtle gradient
- Add a faint inner border via `box-shadow` to give surfaces a glass-like edge
- Use `--shadow-md` or `--shadow-lg` on the main game container so it lifts off the page

---

## Interactive States

Every interactive element needs all four states:

| State    | What to change                                      |
|----------|-----------------------------------------------------|
| Default  | Base styles                                         |
| Hover    | Lighten background or add glow/shadow, lift `-1px`  |
| Active   | Scale down slightly, push shadow inward             |
| Disabled | `opacity: 0.4`, `cursor: not-allowed`               |

- Replace browser focus outlines with a custom `box-shadow` focus ring
- Hoverable game squares get an inset border on hover, not just a color change
- Selected/active pieces glow with `--shadow-accent` — don't just recolor them

---

## Game-Specific Patterns

- Status messages: win uses `--color-success`, loss uses `--color-danger`, neutral uses `--color-accent`
- Overlays and result screens: dark translucent background over the board, content panel with `--radius-lg` and `--shadow-lg`, animate in with fade + scale
- Headings use tight letter-spacing (`-0.02em`), uppercase labels use wide letter-spacing (`0.06em`)
- Use `--color-text-secondary` for body copy, reserve `--color-text-primary` for headings and emphasis

---

## Layout

- Center game content both vertically and horizontally
- Games must be usable on mobile — use `max-width` on the game container
- Always include `box-sizing: border-box` reset

---

## Empty & Loading States

- Empty areas: dashed border + centered muted text — never leave blank unstyled regions
- Loading: pulsing opacity animation

---

## Checklist Before Submitting Any UI

- [ ] All colors use semantic variables
- [ ] All spacing uses scale variables
- [ ] All interactive elements have hover, active, and disabled states with transitions
- [ ] Numbers/scores use `--font-mono`
- [ ] Game container has `max-width` and is centered
- [ ] Tested at mobile width (375px)
- [ ] Buttons have depth, gradient, and lift on hover
- [ ] No surface is completely flat
- [ ] Headings use tight letter-spacing, uppercase labels use wide letter-spacing
- [ ] Focus states are custom, not browser default
- [ ] Hoverable game squares have inset border feedback
- [ ] Selected pieces glow with `--shadow-accent`
- [ ] All state changes animate — nothing snaps
- [ ] Result/overlay screens animate in with fade + scale
- [ ] Empty states are explicitly styled
