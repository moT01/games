# Cribbage UI Update

Reference style: number-tiles (dark background, gold/yellow accents, clean bordered panels, readable typography).

---

## Layout

- [x] Game fills the full viewport at all times
- [x] Persistent layout during play: computer area (top), board (middle), play area (center), player hand (bottom) — zones stay constant across phases, only content inside them changes
- [x] Peg board always visible during play phases (deal, discard, cut, play, show, summary); hidden only on home and cut-for-deal screens
- [x] No large empty dark areas — every zone feels intentional and used

---

## Cards

- [x] Card backs have a real back design — a pattern, not a solid color block
- [x] Player hand sorted low to high on deal; player can drag to rearrange
- [x] Cards large enough to read rank and suit without squinting

---

## Cut-for-Deal Screen

- [x] Deck displayed as a slightly spread horizontal stack — cards overlapping with just the back of each peeking out left to right, like a hand-spread deck on a table
- [x] Player clicks anywhere along the spread to cut; the selected card flips face-up
- [x] Computer's card auto-flips after a short delay

---

## Persistent UI Elements

- [x] Theme toggle visible on every screen
- [x] Donate button visible on every screen
- [x] Quit/Home button visible during all play phases; opens a confirm modal before exiting

---

## Computer Visibility

- [x] Computer's hand always shown as face-down card backs with a count label
- [x] Computer actions are sequential with status messages: "Computer is discarding...", "Computer plays 7 of hearts", "Computer scores 6 points"
- [x] Discard phase clearly labels whose crib it is ("Your Crib" / "Computer's Crib") before and after discarding
- [x] After player confirms discard, show computer discarding sequentially before moving on

---

## Peg Board

- [x] Renders as an actual board with individual holes (dots/circles), not a filled bar
- [x] Two pegs per player (front and back), distinct colors for human vs computer
- [x] Skunk line at hole 61 visually marked
- [x] Holes large enough to read clearly

---

## Play Phase

- [x] Running count is large and prominent — most important number during pegging
- [x] Action log or status line showing the last event ("Computer plays 8 of spades — Fifteen for 2!")

---

## Discard Phase

- [x] Whose crib it is clearly stated at the top of the discard UI
- [x] Computer discards sequentially after player confirms, with a brief status message

---

## General Styling

- [x] Match number-tiles conventions: dark background, gold/yellow primary actions, clean bordered panels, consistent padding and typography
- [x] Buttons consistent size and weight across all screens
- [x] Phases feel like one continuous game, not disconnected pages
- [x] Consistent spacing and no elements that feel dropped in place
