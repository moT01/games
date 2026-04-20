# Chess UI Update Checklist

## Main Menu
- [x] Add title section: "Chess" / "A CLASSIC BOARD GAME"
- [x] Replace two-button layout with tab toggle: "vs Computer" / "2 Players"
- [x] Add player color pill toggle: Light (goes first) / Dark — visible in vs Computer mode
- [x] Add Hard mode checkbox — visible in vs Computer mode
- [x] Add wins display: Normal / Hard rows — visible in vs Computer mode
- [x] New Game button — full width primary style
- [x] Resume Game button — full width secondary style, only shown when a saved game exists
- [x] Remove ColorPicker component (color selection moves into main menu)

## Header
- [x] Copy Header component from checkers (Header.tsx + Header.css) — same icons and layout
- [x] Back button while in-game shows a quit confirm modal
- [x] Center status shows whose turn it is, plus check/checkmate/draw state
- [x] Theme toggle persists preference to localStorage as `chess_theme`

## Theme (dark / light)
- [x] Toggle applies `.dark-palette` / `.light-palette` class on body
- [x] Board light and dark squares update colors per theme
- [x] Game card and body background update per theme
- [x] Header background matches theme
- [x] Piece colors update per theme (light pieces / dark pieces)

## AI Difficulty
- [x] Normal: minimax depth 2 (current behavior)
- [x] Hard: minimax depth 4
- [x] Pass difficulty through GameConfig to the game engine
- [x] Track wins separately in localStorage: `chess_wins_normal` / `chess_wins_hard`

## localStorage Persistence
- [x] Save full game state to localStorage on each move (key: `chess_state`)
- [x] Load saved state when Resume is clicked
- [x] Clear saved state when a new game starts or the game ends
- [x] Resume button visibility driven by whether a saved game exists

## Modals
- [x] Quit confirm modal: cancel or quit, with note that the game can be resumed
- [x] Game over modal: result text + Play Again button (replaces current inline overlay)
- [x] Help modal: basic chess rules summary

## Layout
- [x] Wrap app in a `.game-card` with header + body (matching checkers layout)
- [x] Responsive board: `--cell-size: min(72px, calc((100vw - 72px) / 8))`
- [x] Background decorative chess pieces: scattered, static, subtle neutral color
- [x] Move turn/status display from StatusBar into Header center slot
- [x] CapturedPieces and PromotionModal stay in the game body
