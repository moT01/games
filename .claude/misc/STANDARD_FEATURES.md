# Game Standards

These features are required in every game. The planner must include all of them in the plan and checklist.

## UI & Layout

- Use the colors in `global.css` for themes
- Light/dark theme toggle — persisted to local storage - use the `.light-palette` and `.dark-palette` classes in `global.css`
- Donate button — visible on every screen
- Home screen and play screen (no routing, conditional render)
- Confirmation modal for destructive actions (new game, quit)
- Help/Rules/Info modal (whichever is appropriate) — Maybe a "?" button accessible from all screens, content specific to the game

### Home Screen

- The home screen should be the full width and height of the window.
- It should contain all the main menu options, buttons, and everything else centered on the screen - with a border around the whole set of items.
- Behind the items should be a background to match the game. Ideally, elegant and minimal - not overwhelming.

### Play Screen

- The play screen should fill the whole window if possible.
- It should be responsive

## Local Storage

- Theme preference
- Best score / best time (where applicable)
- Last selected mode
- Game state (resume on reload)

## Screens

- Home — mode selection, start button, donate button, theme toggle
- Play — game board, score, controls, help button
- Game over — result, best score, play again

## Accessibility

- Keyboard navigation
- ARIA labels on interactive elements
