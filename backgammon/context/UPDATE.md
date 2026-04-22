# Backgammon UI Update Checklist

## 1. Theme system

- [x] In `global.css`, add `.light-palette` class with overrides for `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--shadow-lg` — use the same values as `chess/src/global.css`.
- [x] Add CSS variables for backgammon board point colors: `--board-point-light` and `--board-point-dark` (dark theme: current blue tones; light theme: neutral grays). Apply them in `BoardPoint.css` instead of hardcoded colors.
- [x] In `App.tsx`, add `theme` state initialized from `localStorage.getItem('backgammon_theme') || 'dark'`. In a `useEffect`, apply/remove `'light-palette'` class on `document.body` and save to `localStorage` whenever theme changes.

---

## 2. Header component (both screens)

- [x] Create `src/components/Header.tsx` and `Header.css`. Props: `showClose: boolean`, `onClose: () => void`, `theme: 'dark' | 'light'`, `onThemeToggle: () => void`, `onHelp: () => void`, `statusText?: string`, `statusClass?: string`.
- [x] Left slot: render an X icon button (`icon-btn` class) only when `showClose` is true. Use the same SVG path as `chess/src/components/Header.tsx`.
- [x] Center slot: render `statusText` in a `<span>` with `statusClass` when provided (for game screen turn indicator).
- [x] Right slot: three `icon-btn` elements in a row:
  - `?` help button (question mark SVG, same as chess Header)
  - Theme toggle button (sun SVG in dark mode, moon SVG in light mode, same as chess Header)
  - Donate link (`<a>` tag, `href="https://www.freecodecamp.org/donate"`, `target="_blank" rel="noopener noreferrer"`) with heart SVG, same as chess Header
- [x] Style `Header.css` using `.game-header`, `.game-header__left`, `.game-header__center`, `.game-header__right`, `.icon-btn` — copy from `chess/src/components/Header.css`.

---

## 3. Menu screen redesign

- [x] In `App.tsx`, add a `.bg-pieces` div (fixed, full-viewport, `pointer-events: none`, `z-index: 0`) containing ~12 scattered backgammon-themed unicode symbols (checker: `⬤`, die faces: `⚀ ⚁ ⚂ ⚃ ⚄ ⚅`) at varied `left`/`top` percentage positions. In `App.css`, style `.bg-piece` at `font-size: 64px`, `color: rgba(255,255,255,0.12)`, with a `.light-palette .bg-piece` override at `rgba(0,0,0,0.1)`.
- [x] Wrap the menu screen in `.app > .game-card > [Header] + .game-card__body` (same card pattern as chess). The `game-card` styles already exist in `App.css`; confirm they are present or add them matching `chess/src/App.css`.
- [x] Inside `.game-card__body`, add a `.game-card__title-section` with `<h1 class="game-title">Backgammon</h1>` and `<p class="game-subtitle">BEAR OFF TO WIN</p>`.
- [x] Add mode tabs below the title: two buttons with class `tab-btn`, one with `tab-btn--active` for the selected mode. Modes: "vs AI" and "2 Players". Update `ModeSelect.tsx` to track `mode` state (`'vs-ai' | 'two-player'`).
- [x] When "vs AI" tab is active, show a `.wins-display` section: label "WINS" and a row showing the saved win count. Read from `localStorage.getItem('backgammon_wins') || '0'`.
- [x] `.home-actions` div with a full-width `.primary-btn` "New Game" button, and a full-width `.secondary-btn` "Resume Game" button shown only when `hasSavedGame` is true.
- [x] Update `ModeSelect.css`: replace existing styles with `.mode-tabs`, `.tab-btn`, `.tab-btn--active`, `.wins-display`, `.wins-label`, `.wins-num`, `.home-actions` — mirror `chess/src/components/ModeSelect.css`.
- [x] Update `ModeSelect` props: add `onSelect` (existing), `onResume: () => void`, `hasSavedGame: boolean`, `winsVsAi: number`, `theme: 'dark' | 'light'`, `onThemeToggle: () => void`, `onHelp: () => void`.

---

## 4. Game screen header

- [x] In `App.tsx`, when rendering the game screen, place `<Header showClose={true} onClose={handleClose} theme={theme} onThemeToggle={toggleTheme} onHelp={() => setShowHelp(true)} statusText={...} statusClass={...} />` at the top of `.app__header`, replacing the current `<StatusBar>` + lone `?` button layout.
- [x] Remove the old `app__help-btn` button and `StatusBar` from the header; pass status text directly to `Header` via `statusText`/`statusClass` props (derive from `state.currentPlayer`, `state.forcedSkip`, `state.phase`, `state.winner` — same logic currently in `StatusBar.tsx`).
- [x] Keep `StatusBar.tsx` and `StatusBar.css` as-is or delete them if no longer used after moving status logic into App.

---

## 5. Save and resume

- [x] In `App.tsx`, add a `useEffect` that watches `state`. When `state.phase === 'playing'`, call `localStorage.setItem('backgammon_save', JSON.stringify(state))`. When `state.phase === 'mode-select'` or `'game-over'`, call `localStorage.removeItem('backgammon_save')`.
- [x] Add `loadSavedGame()` helper: reads `backgammon_save` from localStorage, parses JSON, returns `GameState | null` (wrap in try/catch).
- [x] Add `hasSavedGame` state in `App.tsx` initialized to `loadSavedGame() !== null`.
- [x] Add `handleResume()` in `App.tsx`: call `loadSavedGame()`, if non-null call `setState(saved)`, else ignore.
- [x] In `handleModeSelect`, call `localStorage.removeItem('backgammon_save')` and set `hasSavedGame` to `false` before starting.
- [x] Pass `hasSavedGame` and `onResume={handleResume}` to `<ModeSelect>`.

---

## 6. Quit modal

- [x] Add `QuitModal` function component inline in `App.tsx` (or as a separate file `QuitModal.tsx`). Props: `onCancel: () => void`, `onQuit: () => void`. Renders `.modal-backdrop > .modal-card` with title "Quit Game", body text "Return to the main menu? You can resume your game from there.", and `.modal-actions` with `.secondary-btn` "Cancel" and `.primary-btn` "Quit". Matches pattern in `chess/src/App.tsx`.
- [x] Add `showQuitConfirm` boolean state in `App.tsx`.
- [x] `handleClose()` in `App.tsx`: if `state.phase === 'playing'`, set `showQuitConfirm(true)`; if `state.phase === 'game-over'`, call `handleBackToMenu()` directly.
- [x] `handleQuit()`: set `showQuitConfirm(false)`, then set `state` to `MODE_SELECT_STATE`.
- [x] Render `{showQuitConfirm && <QuitModal onCancel={() => setShowQuitConfirm(false)} onQuit={handleQuit} />}` in the App return.

---

## 7. Win tracking

- [x] Add `winsVsAi` state in `App.tsx` initialized from `parseInt(localStorage.getItem('backgammon_wins') || '0')`.
- [x] In the winner-detection logic (where `phase` is set to `'game-over'`), if `state.mode === 'vs-ai'` and the human player (white) won, call `handleWin()`: increment `winsVsAi`, save to `localStorage.setItem('backgammon_wins', String(next))`.
- [x] Pass `winsVsAi` to `<ModeSelect>`.

---

## 8. Win modal redesign

- [x] Rewrite `WinModal.tsx` to use the standard modal pattern: `.modal-backdrop` (click backdrop calls `onPlayAgain`) > `.modal-card`. Title: "{White/Black} wins!" as `.modal-title`. Actions: `.primary-btn` "Play Again", `.secondary-btn` "Main Menu" (calls a new `onMainMenu` prop that sets state to `MODE_SELECT_STATE`).
- [x] Remove `WinModal.css` (delete file and import). Styles come from global modal classes in `App.css`.
- [x] Add `onMainMenu` prop to `WinModal` and pass `handleBackToMenu` from `App.tsx`.

---

## 9. Help modal redesign

- [x] Rewrite `HelpModal.tsx` to use the standard modal pattern: `.modal-backdrop` (click to close) > `.modal-card`. Keep all existing rule sections (Objective, Rules, Bearing Off, Key Strategies, Common Mistakes). Remove the internal `✕` close button inside the modal. Add `.modal-actions` at the bottom with a `.primary-btn` "Got it" button calling `onClose`. Matches pattern in `chess/src/App.tsx`.
- [x] Remove `HelpModal.css` (delete file and import). Styles come from global modal classes in `App.css`.

---

## 10. Rename black/white to dark/light

- [x] In `gameLogic.ts`, change `type Color = 'white' | 'black'` to `type Color = 'light' | 'dark'`. Update all references in the file: `bar: { white: ..., black: ... }` becomes `bar: { light: ..., dark: ... }`, same for `off`, and all string literals `'white'`/`'black'` used as Color values. Update comments at the top of the file (e.g. "White moves" becomes "Light moves", "Black home board" becomes "Dark home board").
- [x] Update every file that imports or uses `Color` or references `'white'`/`'black'` as player identifiers: `App.tsx`, `StatusBar.tsx`, `Board.tsx`, `Bar.tsx`, `OffArea.tsx`, `Checker.tsx`, `BoardPoint.tsx`, `WinModal.tsx`.
- [x] In all CSS files, rename modifier classes `--white` and `--black` to `--light` and `--dark` (e.g. `.status-bar__player--white` becomes `.status-bar__player--light`, `.checker--black` becomes `.checker--dark`). Update the matching `className` strings in all TSX files.
- [x] Update all user-facing labels: "White" becomes "Light", "Black" becomes "Dark" everywhere they appear as player names in status text, win messages, and the WinModal.

---

## 11. Global CSS additions

- [x] Add shared button classes to `global.css` or `App.css` if not already present: `.primary-btn`, `.secondary-btn`, `.icon-btn`, `.modal-backdrop`, `.modal-card`, `.modal-title`, `.modal-content`, `.modal-actions`, `.game-card`, `.game-card__body`, `.game-card__title-section`, `.game-title`, `.game-subtitle`. Copy from `chess/src/App.css`.
- [x] Add `button, a, [role="button"], label { cursor: pointer; }` reset to `global.css` if not present.
