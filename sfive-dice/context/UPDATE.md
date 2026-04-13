# Five Dice — Update Checklist

## 1. Light/Dark Theme Toggle
- [x] Add theme toggle button visible on every screen
- [x] Persist theme preference to local storage
- [x] Apply theme via CSS class or data attribute on root element

## 2. Donate Button
- [x] Add donate button visible on every screen (home and play)

## 3. Home Screen
- [x] Add a home screen (conditional render, no routing)
- [x] Home screen: start button, donate button, theme toggle — all centered with a border around the group
- [x] Add a background behind the home screen items that matches the game aesthetic (elegant, minimal)
- [x] Play screen is shown after start; home screen shown after game over "quit" or on initial load

## 4. Confirmation Modal
- [x] Show a confirmation modal before starting a new game mid-game (destructive action)
- [x] Show a confirmation modal before quitting to home mid-game

## 5. Local Storage
- [x] Save and restore game state on reload (resume in progress game)
- [x] Save and display best score (shown on game over screen and home screen)

## 6. Accessibility
- [x] Add ARIA labels to all interactive elements (dice, buttons, score rows)
- [x] Support keyboard navigation (tab through dice and scorecard rows, space/enter to activate)
